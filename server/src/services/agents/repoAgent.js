import path from "path";
import RepositoryModel from "../../models/Repository.model.js";
import DependencyModel from "../../models/Dependency.model.js";
import FileModel from "../../models/File.model.js";
import AnalyzeResultModel from "../../models/AnalyzeResult.model.js";
import { extractModules } from "../parser/extractModules.js";
import { repoSearchTool } from "./tools/repoSearchTool.js";
import { generateResponse } from "../llm/providers/openai.js";

const normalizeRepoPath = (repository, filePath = "") => {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  const localPath = repository?.localPath?.replace(/\\/g, "/");

  if (localPath && normalized.startsWith(localPath)) {
    return normalized.slice(localPath.length).replace(/^[/\\]/, "");
  }

  const serverIndex = normalized.indexOf("server/");
  const clientIndex = normalized.indexOf("client/");
  if (serverIndex !== -1) return normalized.slice(serverIndex);
  if (clientIndex !== -1) return normalized.slice(clientIndex);
  return normalized;
};

const normalizePathList = (repository, paths = []) =>
  [...new Set((paths || []).map((p) => normalizeRepoPath(repository, p)).filter(Boolean))];

const normalizeNavigation = (repository, items = []) =>
  (items || [])
    .map((item) => ({
      ...item,
      file: normalizeRepoPath(repository, item?.file || ""),
    }))
    .filter((item) => item.file);

const includesAny = (text, words) => words.some((w) => text.includes(w));

const tokenize = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9_./-]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

const buildRepoSignalSet = (repository, dependencies = [], files = [], modules = {}) => {
  const signals = new Set();
  for (const dep of dependencies) {
    if (dep?.packageName) signals.add(String(dep.packageName).toLowerCase());
  }
  for (const file of files) {
    const filePath = normalizeRepoPath(repository, file?.filePath || "");
    const fileName = String(file?.fileName || path.basename(filePath || "")).toLowerCase();
    if (fileName) signals.add(fileName);
    for (const part of filePath.toLowerCase().split("/")) {
      if (part && part.length > 2) signals.add(part);
    }
  }
  for (const key of Object.keys(modules || {})) {
    if (key) signals.add(String(key).toLowerCase());
  }
  for (const entry of repository?.entryPoints || []) {
    const file = (typeof entry === "string" ? entry : entry?.file) || "";
    const normalized = normalizeRepoPath(repository, file).toLowerCase();
    if (normalized) signals.add(normalized);
  }
  return signals;
};

const isRepositoryRelevant = ({
  question = "",
  repository,
  dependencies = [],
  files = [],
  modules = {},
  relevantChunks = [],
}) => {
  const tokens = tokenize(question);
  if (!tokens.length) return false;
  const q = String(question || "").toLowerCase();

  const genericRepoIntent =
    includesAny(q, ["repo", "repository", "codebase"]) &&
    includesAny(q, [
      "summary",
      "overview",
      "purpose",
      "architecture",
      "module",
      "dependency",
      "entry point",
      "flow",
      "start",
      "onboarding",
      "files",
      "tech stack",
    ]);

  const repoSignals = buildRepoSignalSet(repository, dependencies, files, modules);
  const overlap = tokens.filter((t) => repoSignals.has(t)).length;

  const bestScore = Math.max(
    ...relevantChunks
      .map((chunk) => Number(chunk?.score))
      .filter((score) => Number.isFinite(score)),
    -1,
  );

  // Accept if we have either lexical overlap with repo index or strong semantic retrieval.
  return genericRepoIntent || overlap >= 1 || bestScore >= 0.22;
};

const classifyIntent = (question = "") => {
  const q = question.toLowerCase();

  if (
    includesAny(q, [
      "architecture",
      "high level design",
      "repo summary",
      "summary of this repo",
      "summary of this repository",
      "purpose of this repo",
      "purpose of this repository",
      "repo overview",
      "repository overview",
      "system design",
      "overall flow",
    ])
    || (
      includesAny(q, ["repo", "repository", "codebase"]) &&
      includesAny(q, ["summary", "purpose", "overview"])
    )
  ) {
    return "architecture";
  }

  if (
    includesAny(q, [
      "onboarding",
      "where to start",
      "getting started",
      "new developer start",
      "new developer",
      "start in this repository",
      "how should i start",
    ])
  ) {
    return "onboarding";
  }

  if (includesAny(q, ["critical path", "execution path", "request flow"])) {
    return "critical_path";
  }

  if (
    includesAny(q, [
      "dependency",
      "dependencies",
      "library",
      "libraries",
      "package",
      "framework",
    ])
  ) {
    return "dependencies";
  }

  if (includesAny(q, ["tech stack", "built with", "technology stack"])) {
    return "tech_stack";
  }

  if (
    includesAny(q, [
      "entry point",
      "start file",
      "bootstrap",
      "main file",
      "where execution starts",
    ])
  ) {
    return "entry_points";
  }

  if (includesAny(q, ["module", "modules", "feature", "sections"])) {
    return "modules";
  }

  if (includesAny(q, ["all files", "list files", "file uses", "files used", "what files"])) {
    return "files";
  }

  return "general";
};

const detectTechStackFromDeps = (dependencies = []) => {
  const packages = new Set(dependencies.map((d) => d.packageName).filter(Boolean));
  const has = (...names) => names.some((n) => packages.has(n));

  return {
    frontend: [
      has("react") && "React",
      has("next") && "Next.js",
      has("react-router-dom") && "React Router",
      has("redux", "@reduxjs/toolkit", "react-redux") && "Redux",
      has("tailwindcss") && "Tailwind CSS",
      has("@mui/material") && "Material UI",
    ].filter(Boolean),
    backend: [
      has("express") && "Express",
      has("nestjs") && "NestJS",
      has("fastify") && "Fastify",
      has("koa") && "Koa",
      has("socket.io") && "Socket.IO",
    ].filter(Boolean),
    database: [
      has("mongoose", "mongodb") && "MongoDB",
      has("pg") && "PostgreSQL",
      has("mysql2") && "MySQL",
      has("sqlite3") && "SQLite",
      has("redis", "ioredis") && "Redis",
    ].filter(Boolean),
    styling: [
      has("tailwindcss") && "Tailwind CSS",
      has("bootstrap") && "Bootstrap",
      has("sass") && "Sass",
    ].filter(Boolean),
  };
};

const formatArchitecture = (analysis, repository, modules) => {
  const summary = analysis?.architectureSummary?.trim();
  if (!summary) {
    return "I could not find enough repository evidence.";
  }

  const entryPoints = (repository?.entryPoints || [])
    .slice(0, 6)
    .map((e) => `\`${e?.file || e}\``)
    .filter(Boolean);

  const moduleNames = Object.keys(modules || {}).slice(0, 8);
  const moduleLine = moduleNames.length ? moduleNames.join(", ") : "Not detected";
  const entryLine = entryPoints.length ? entryPoints.join(", ") : "Not detected";

  return `${summary}\n\n**Key entry points:** ${entryLine}\n\n**Detected modules:** ${moduleLine}`;
};

const formatDependencies = (dependencies = [], usageByPackage = {}) => {
  if (!dependencies.length) return "I could not find dependency records for this repository.";

  const sorted = [...dependencies].sort((a, b) =>
    String(a.packageName || "").localeCompare(String(b.packageName || "")),
  );

  const lines = sorted
    .slice(0, 40)
    .map((d) => {
      const usedIn = (usageByPackage[d.packageName] || []).slice(0, 3);
      const usageText = usedIn.length
        ? ` - used in ${usedIn.map((f) => `\`${f}\``).join(", ")}`
        : " - usage file not found in index";
      return `- \`${d.packageName}\` (${d.version || "unknown"})${usageText}`;
    })
    .join("\n");

  const extra =
    sorted.length > 40
      ? `\n\nShowing first 40 of ${sorted.length}. Ask "show all dependencies" for full list.`
      : "";

  return `I found **${sorted.length}** dependencies.\n\n${lines}${extra}`;
};

const formatFiles = (repository, files = []) => {
  if (!files.length) return "I could not find indexed files for this repository.";

  const normalized = files.map((f) => ({
    ...f,
    filePath: normalizeRepoPath(repository, f.filePath),
  }));

  const categoryCount = normalized.reduce((acc, file) => {
    const key = file.category || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const categories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => `- **${name}:** ${count}`)
    .join("\n");

  const sample = normalized
    .slice(0, 60)
    .map((file) => `- \`${file.filePath}\``)
    .join("\n");

  return `I found **${normalized.length}** indexed files.\n\nTop categories:\n${categories}\n\nSample files:\n${sample}`;
};

const formatTechStack = (repository, dependencies) => {
  const inferred = detectTechStackFromDeps(dependencies);
  const persisted = repository?.techStack || {};

  const merged = {
    frontend: [...new Set([...(persisted.frontend || []), ...(inferred.frontend || [])])],
    backend: [...new Set([...(persisted.backend || []), ...(inferred.backend || [])])],
    database: [...new Set([...(persisted.database || []), ...(inferred.database || [])])],
    styling: [...new Set([...(persisted.styling || []), ...(inferred.styling || [])])],
  };

  return [
    "Detected tech stack:",
    `- **Frontend:** ${merged.frontend.length ? merged.frontend.join(", ") : "Not clearly detected"}`,
    `- **Backend:** ${merged.backend.length ? merged.backend.join(", ") : "Not clearly detected"}`,
    `- **Database:** ${merged.database.length ? merged.database.join(", ") : "Not clearly detected"}`,
    `- **Styling:** ${merged.styling.length ? merged.styling.join(", ") : "Not clearly detected"}`,
  ].join("\n");
};

const formatEntryPoints = (repository) => {
  const entries = repository?.entryPoints || [];
  if (!entries.length) return "No entry points detected yet.";

  const lines = entries
    .slice(0, 20)
    .map((entry) => {
      const file = typeof entry === "string" ? entry : entry?.file;
      const framework = typeof entry === "object" ? entry?.framework : "";
      return `- \`${file}\`${framework ? ` (${framework})` : ""}`;
    })
    .join("\n");

  return `Detected entry points:\n\n${lines}`;
};

const formatModules = (modules = {}) => {
  const names = Object.keys(modules || {});
  if (!names.length) return "No modules extracted yet.";

  const lines = names
    .slice(0, 12)
    .map((name) => {
      const files = Array.isArray(modules[name]) ? modules[name] : [];
      return `- **${name}:** ${files.length} file(s)`;
    })
    .join("\n");

  return `Detected repository modules:\n\n${lines}`;
};

const formatOnboarding = (analysis, repository) => {
  if (analysis?.onboardingGuide?.trim()) return analysis.onboardingGuide;

  const entryPoints = (repository?.entryPoints || [])
    .slice(0, 5)
    .map((e) => `\`${e?.file || e}\``)
    .filter(Boolean);

  return [
    "Start from the entry points, then follow service and middleware flow.",
    `- Entry points: ${entryPoints.length ? entryPoints.join(", ") : "Not detected"}`,
    "- Read `server/src/routes/*` then matching controllers/services.",
    "- Use dependency and module views to map responsibilities.",
  ].join("\n");
};

export const repoAgent = async (repositoryId, question, chatHistory = []) => {
  try {
    const [repository, analysis, dependencies, files] = await Promise.all([
      RepositoryModel.findById(repositoryId).lean(),
      AnalyzeResultModel.findOne({ repositoryId }).lean(),
      DependencyModel.find({ repositoryId }).lean(),
      FileModel.find({ repositoryId }).select("filePath fileName category extension imports").lean(),
    ]);

    if (!repository) {
      return {
        answer: "Repository not found for the provided repositoryId.",
        sources: [],
        navigationHelp: [],
      };
    }

    const modules = analysis?.modules && Object.keys(analysis.modules).length
      ? analysis.modules
      : await extractModules(repositoryId);

    const intent = classifyIntent(question);
    let answer = "";
    let sources = [];
    let navigationHelp = [];

    if (intent === "architecture") {
      answer = formatArchitecture(analysis, repository, modules);
      sources = normalizePathList(repository, [
        ...(repository.entryPoints || []).map((e) => (typeof e === "string" ? e : e?.file)),
      ]).slice(0, 8);
      navigationHelp = normalizeNavigation(
        repository,
        sources.map((file) => ({ title: "Entry point", file })),
      );
      return { answer, sources, navigationHelp };
    }

    if (intent === "dependencies") {
      const usageByPackage = {};
      const normalizedFiles = files.map((f) => ({
        ...f,
        filePath: normalizeRepoPath(repository, f.filePath),
        imports: Array.isArray(f.imports) ? f.imports : [],
      }));

      for (const dep of dependencies) {
        const packageName = dep.packageName;
        if (!packageName) continue;
        usageByPackage[packageName] = normalizedFiles
          .filter((file) =>
            file.imports.some((imp) => {
              const value = String(imp || "");
              return value === packageName || value.startsWith(`${packageName}/`);
            }),
          )
          .map((file) => file.filePath)
          .filter(Boolean);
      }

      answer = formatDependencies(dependencies, usageByPackage);
      sources = ["server/package.json", "client/package.json"];
      navigationHelp = normalizeNavigation(
        repository,
        sources.map((file) => ({ title: "Dependency file", file })),
      );
      return { answer, sources, navigationHelp };
    }

    if (intent === "files") {
      answer = formatFiles(repository, files);
      sources = normalizePathList(
        repository,
        files
        .map((f) => normalizeRepoPath(repository, f.filePath))
        .filter(Boolean),
      ).slice(0, 20);
      navigationHelp = normalizeNavigation(
        repository,
        sources.slice(0, 8).map((file) => ({
          title: path.basename(file),
          file,
        })),
      );
      return { answer, sources, navigationHelp };
    }

    if (intent === "tech_stack") {
      answer = formatTechStack(repository, dependencies);
      sources = ["server/package.json", "client/package.json"];
      navigationHelp = normalizeNavigation(
        repository,
        sources.map((file) => ({ title: "Dependency file", file })),
      );
      return { answer, sources, navigationHelp };
    }

    if (intent === "entry_points") {
      answer = formatEntryPoints(repository);
      sources = normalizePathList(repository, (repository.entryPoints || [])
        .map((e) => (typeof e === "string" ? e : e?.file))
        .filter(Boolean));
      navigationHelp = normalizeNavigation(
        repository,
        sources.map((file) => ({ title: "Entry point", file })),
      );
      return { answer, sources, navigationHelp };
    }

    if (intent === "modules") {
      answer = formatModules(modules);
      const moduleFiles = Object.values(modules || {})
        .flat()
        .map((f) => (typeof f === "string" ? f : f?.filePath))
        .filter(Boolean)
        .slice(0, 15);
      sources = normalizePathList(repository, moduleFiles);
      navigationHelp = normalizeNavigation(
        repository,
        moduleFiles.slice(0, 8).map((file) => ({ title: "Module file", file })),
      );
      return { answer, sources, navigationHelp };
    }

    if (intent === "onboarding") {
      answer = formatOnboarding(analysis, repository);
      sources = normalizePathList(repository, (repository.entryPoints || [])
        .map((e) => (typeof e === "string" ? e : e?.file))
        .filter(Boolean)
        .slice(0, 8));
      navigationHelp = normalizeNavigation(
        repository,
        sources.map((file) => ({ title: "Start here", file })),
      );
      return { answer, sources, navigationHelp };
    }

    if (intent === "critical_path") {
      answer =
        analysis?.criticalPathAnalysis?.trim() ||
        "Critical path analysis is not available yet for this repository.";
      return { answer, sources: [], navigationHelp: [] };
    }

    // General questions: structured context first, semantic chunks second.
    const relevantChunks = await repoSearchTool(repositoryId, question);
    if (
      !isRepositoryRelevant({
        question,
        repository,
        dependencies,
        files,
        modules,
        relevantChunks,
      })
    ) {
      return {
        answer:
          "I can help only with this repository. Please ask repository-related questions about architecture, files, modules, dependencies, flows, or specific code paths.",
        sources: [],
        navigationHelp: [],
      };
    }

    sources = normalizePathList(
      repository,
      [...new Set(relevantChunks.map((item) => item.filePath).filter(Boolean))],
    ).slice(0, 8);

    const structuredContext = `
Repository: ${repository.repoName}
Tech stack: ${JSON.stringify(repository.techStack || {}, null, 2)}
Entry points: ${(repository.entryPoints || []).map((e) => (e?.file || e)).join(", ")}
Top modules: ${Object.keys(modules || {}).join(", ")}
Architecture summary: ${analysis?.architectureSummary || "N/A"}
Critical path: ${analysis?.criticalPathAnalysis || "N/A"}
Dependencies sample: ${(dependencies || []).slice(0, 20).map((d) => `${d.packageName}@${d.version}`).join(", ")}
`;

    const chunkContext = relevantChunks
      .slice(0, 6)
      .map((item) => `FILE: ${normalizeRepoPath(repository, item.filePath)}\nCODE: ${item.content}`)
      .join("\n\n");

    const prompt = `
You are a repository intelligence assistant.
Answer the user using the repository context below. Be precise and grounded.
If evidence is insufficient, say: "I could not find enough repository evidence."

Rules:
- Start with a direct answer.
- Use short bullets only if needed.
- Mention concrete file paths when available.
- Keep response under 220 words.

Recent chat context (oldest to latest):
${(chatHistory || [])
  .slice(-8)
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n") || "No previous messages."}

Structured repository context:
${structuredContext}

Semantic snippets:
${chunkContext || "No semantic snippets available."}

User question:
${question}
`;

    answer = await generateResponse(prompt);

    navigationHelp = normalizeNavigation(
      repository,
      sources.slice(0, 5).map((file) => ({
        title: "Relevant file",
        file,
      })),
    );

    return { answer, sources, navigationHelp };
  } catch (error) {
    console.log("Repo Agent Error:", error);
    throw error;
  }
};
