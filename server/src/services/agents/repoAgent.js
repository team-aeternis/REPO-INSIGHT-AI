
import { generateResponse } from "../llm/providers/openai.js";

import fs from "fs";

import path from "path";

import { dependencyTool } from "./tools/dependencyTool.js";

import { entryPointTool } from "./tools/entryPointTool.js";

import { repoSearchTool } from "./tools/repoSearchTool.js";

import { extractModules } from "../parser/extractModules.js";

import FileModel from "../../models/File.model.js";

import RepositoryModel from "../../models/Repository.model.js";

import DependencyModel from "../../models/Dependency.model.js";

const MAX_CONTEXT_CHARS = 1400;

const clipForPrompt = (value, limit = MAX_CONTEXT_CHARS) => {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);

  if (!text || text.length <= limit) {
    return text || "";
  }

  return `${text.slice(0, limit)}\n...[truncated for readability]`;
};

const normalizeRepoPath = (repository, filePath = "") => {
  const normalized = filePath.replace(/\\/g, "/");
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

const humanizeModelName = (fileName = "") =>
  fileName
    .replace(/\.(model|models|schema)\./i, ".")
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ");

const findModelFiles = async (repositoryId) => {
  const repository = await RepositoryModel.findById(repositoryId).lean();

  const modelFiles = await FileModel.find({
    repositoryId,
    $or: [
      { category: "model" },
      { filePath: /(^|[/\\])models?([/\\]|$)/i },
      { fileName: /\.model\./i },
      { fileName: /\.schema\./i },
    ],
  })
    .select("filePath fileName summary exports imports")
    .lean();

  const indexedFiles = modelFiles.map((file) => ({
    filePath: normalizeRepoPath(repository, file.filePath),
    fileName: file.fileName || path.basename(file.filePath || ""),
    summary: file.summary,
    exports: file.exports,
    imports: file.imports,
  }));

  if (indexedFiles.length > 0 || !repository?.localPath) {
    return indexedFiles;
  }

  const fallbackFiles = [];
  const visit = (dirPath) => {
    if (!fs.existsSync(dirPath)) return;

    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (["node_modules", ".git", "dist", "build"].includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }

      const normalized = fullPath.replace(/\\/g, "/");
      const isModelFile =
        /(^|[/\\])models?([/\\]|$)/i.test(normalized) ||
        /\.(model|models|schema)\./i.test(entry.name);

      if (!isModelFile) continue;

      fallbackFiles.push({
        filePath: normalizeRepoPath(repository, fullPath),
        fileName: entry.name,
      });
    }
  };

  visit(repository.localPath);

  return fallbackFiles;
};

const formatModelAnswer = (modelFiles) => {
  if (modelFiles.length === 0) {
    return "I could not find any model or schema files in this repository index.";
  }

  const modelLines = modelFiles
    .slice(0, 20)
    .map((file) => {
      const modelName = humanizeModelName(file.fileName);
      return `- **${modelName}** - \`${file.filePath}\``;
    })
    .join("\n");

  const extra =
    modelFiles.length > 20
      ? `\n\nI found ${modelFiles.length - 20} more model files. Ask for "all model files" if you want the complete list.`
      : "";

  return `The repository uses these model/schema files:\n\n${modelLines}${extra}`;
};

const formatTechStackAnswer = async (repositoryId) => {
  const repository = await RepositoryModel.findById(repositoryId).lean();
  const dependencies = await DependencyModel.find({ repositoryId })
    .select("packageName version type ecosystem")
    .lean();

  const packages = new Set(dependencies.map((dep) => dep.packageName));
  const hasPackage = (...names) => names.some((name) => packages.has(name));

  const frontend = [
    hasPackage("react") && "React",
    hasPackage("vite", "@vitejs/plugin-react") && "Vite",
    hasPackage("react-router-dom") && "React Router",
    hasPackage("@reduxjs/toolkit", "react-redux") && "Redux Toolkit",
    hasPackage("tailwindcss", "@tailwindcss/vite") && "Tailwind CSS",
    hasPackage("@mui/material", "@mui/icons-material") && "Material UI",
    hasPackage("axios") && "Axios",
  ].filter(Boolean);

  const backend = [
    "Node.js",
    hasPackage("express") && "Express",
    hasPackage("mongoose") && "Mongoose",
    hasPackage("openai") && "OpenAI-compatible SDK",
    hasPackage("@huggingface/inference") && "Hugging Face Inference",
    hasPackage("@google/generative-ai") && "Google Generative AI",
    hasPackage("jest") && "Jest",
  ].filter(Boolean);

  const database = [
    hasPackage("mongoose") && "MongoDB",
    ...(repository?.techStack?.database || []),
  ].filter(Boolean);

  const sections = [
    ["Frontend", frontend],
    ["Backend", backend],
    ["Database", [...new Set(database)]],
  ]
    .map(([label, values]) => `- **${label}:** ${values.length ? values.join(", ") : "Not clearly detected"}`)
    .join("\n");

  const packageHint = dependencies
    .slice(0, 12)
    .map((dep) => dep.packageName)
    .join(", ");

  return `This repository is a full-stack JavaScript app.\n\n${sections}\n\nEvidence comes from the repository dependency index${packageHint ? `, including \`${packageHint}\`` : ""}.`;
};

export const repoAgent = async (
  repositoryId,

  question,
) => {
  try {
    let context = "";

    let sources = [];

    let navigationHelp = [];

    const lowerQuestion = question.toLowerCase();

    // dependency related questions

    if (
      lowerQuestion.includes("dependency") ||
      lowerQuestion.includes("library") ||
      lowerQuestion.includes("framework")
    ) {
      const dependencies = await dependencyTool(repositoryId);

      context = `

Dependencies:

${clipForPrompt(dependencies, 5000)}
`;
    } else if (
      lowerQuestion.includes("tech stack") ||
      lowerQuestion.includes("technology stack") ||
      lowerQuestion.includes("technologies") ||
      lowerQuestion.includes("stack used") ||
      lowerQuestion.includes("built with")
    ) {
      sources = ["package.json", "client/package.json", "server/package.json"];
      navigationHelp = sources.map((file) => ({ title: "Dependency file", file }));

      return {
        answer: await formatTechStackAnswer(repositoryId),

        sources,

        navigationHelp,
      };
    }

    // entry point related questions
    else if (
      lowerQuestion.includes("entry") ||
      lowerQuestion.includes("start") ||
      lowerQuestion.includes("bootstrap")
    ) {
      const entryPoints = await entryPointTool(repositoryId);

      context = `

Entry Points:

${clipForPrompt(entryPoints, 4000)}
`;

      navigationHelp = entryPoints.map((entry) => ({
        title: "Application Entry Point",

        file: entry.file || entry,
      }));
    } else if (
      lowerQuestion.includes("model") ||
      lowerQuestion.includes("schema") ||
      lowerQuestion.includes("collection") ||
      lowerQuestion.includes("entity") ||
      lowerQuestion.includes("entities")
    ) {
      const modelFiles = await findModelFiles(repositoryId);

      sources = modelFiles.map((file) => file.filePath).filter(Boolean);

      context = `

Repository model/schema files:

${clipForPrompt(modelFiles, 6000)}
`;

      navigationHelp = modelFiles.slice(0, 6).map((file) => ({
        title: file.fileName,

        file: file.filePath,
      }));

      return {
        answer: formatModelAnswer(modelFiles),

        sources,

        navigationHelp,
      };
    } else if (
      lowerQuestion.includes("module") ||
      lowerQuestion.includes("feature") ||
      lowerQuestion.includes("section")
    ) {
      const modules = await extractModules(repositoryId);

      context = `

Repository Modules:

${clipForPrompt(modules, 5000)}
`;

      navigationHelp = Object.entries(modules)
        .slice(0, 3)
        .map(([moduleName, files]) => ({
          title: moduleName,

          file: files?.[0]?.filePath || "",
        }));
    }

    // default semantic repo search
    else {
      const relevantChunks = await repoSearchTool(
        repositoryId,

        question,
      );

      sources = [...new Set(relevantChunks.map((item) => item.filePath))].slice(
        0,
        5,
      );

      context = relevantChunks
        .map(
          (item) => `

FILE:
${item.filePath}



CODE CHUNK:
${clipForPrompt(item.content)}
`,
        )
        .join("\n\n");

      navigationHelp = [
        {
          title: "Frontend Entry",

          file: "client/src/main.jsx",
        },

        {
          title: "Backend Entry",

          file: "server/src/app.js",
        },

        {
          title: "Authentication Logic",

          file: "server/src/middlewares/auth.middleware.js",
        },
      ];
    }

    // final prompt

    const prompt = `
You are a helpful repository chat assistant. Answer like ChatGPT: clear, conversational, and easy to scan.

Use ONLY the provided repository context. If the context is not enough, say exactly:
"I could not find enough repository evidence."

Response rules:
- Start with a direct answer in 1-2 sentences.
- Use short markdown bullets only when they improve readability.
- Mention important file paths as inline code.
- Keep the response under 220 words unless the user explicitly asks for depth.
- Do not paste raw JSON, raw repository context, embeddings, metadata, or full code chunks.
- Do not include labels like "Repository Context", "FILE", "CODE CHUNK", or "Provide".
- If code is necessary, include at most 12 lines and explain why it matters.
- Avoid repeating file names excessively.

Repository context:

${context}

User question:
${question}
`;

    // generate grounded answer

    const response = await generateResponse(prompt);

    return {
      answer: response,

      sources,

      navigationHelp,
    };
  } catch (error) {
    console.log("Repo Agent Error:", error);

    throw error;
  }
};
