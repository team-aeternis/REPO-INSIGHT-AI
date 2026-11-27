import RepositoryModel from "../../models/Repository.model.js";

import DependencyModel from "../../models/Dependency.model.js";


import { similaritySearchMany } from "../vector/similaritySearch.js";

import { generateResponse } from "../llm/providers/openai.js";

import { extractModules } from "./extractModules.js";
import { parseAnalysisSections } from "./parseAnalysisSections.js";


export const summarizeRepo = async (
  repositoryId,
  retrievedChunks = null,
  precomputedModules = null,
) => {
  try {
    const [repository, dependencies, modules, semanticChunks] = await Promise.all([
        RepositoryModel.findById(repositoryId).lean(),
        DependencyModel.find({ repositoryId }).select("packageName").lean(),
        precomputedModules || extractModules(repositoryId),
        retrievedChunks || similaritySearchMany(repositoryId, [
          "project architecture",
          "authentication flow",
          "database connection",
        ], 2),
      ]);
    const [architectureChunks = [], authChunks = [], databaseChunks = []] = semanticChunks;

    if (!repository) throw new Error("Repository not found");

    const compactModules = Object.fromEntries(
      Object.entries(modules || {}).slice(0, 8).map(([name, files]) => [
        name,
        (Array.isArray(files) ? files : []).slice(0, 6).map((file) =>
          typeof file === "string" ? file : file?.filePath || file?.fileName || "",
        ).filter(Boolean),
      ]),
    );
    const entryPoints = (repository.entryPoints || [])
      .slice(0, 12)
      .map((entry) => typeof entry === "string" ? entry : entry?.file)
      .filter(Boolean);
    const formatChunks = (items) => items
      .slice(0, 2)
      .map((item) => String(item?.chunk?.chunkText || "").slice(0, 1000))
      .filter(Boolean)
      .join("\n\n---\n\n") || "No relevant code chunks were retrieved.";

    const context = `Repository: ${repository.repoName}\n` +
      `Dependencies: ${dependencies.slice(0, 35).map((dep) => dep.packageName).filter(Boolean).join(", ")}\n` +
      `Modules and sample files: ${JSON.stringify(compactModules)}\n` +
      `Entry points: ${entryPoints.join(", ")}\n` +
      `Architecture evidence:\n${formatChunks(architectureChunks)}\n\n` +
      `Authentication evidence:\n${formatChunks(authChunks)}\n\n` +
      `Database evidence:\n${formatChunks(databaseChunks)}`;

    // Keep analysis prompts comfortably below the provider's shared TPM budget.
    const prompt = `You are a repository intelligence assistant. Use only the evidence below; do not infer frameworks or flows without evidence. Cite exact paths where possible. Be concise and return these three Markdown sections with the exact headings shown:\n\n## Architecture\nDescribe the repository structure and main modules.\n\n## Critical Execution Paths\nSummarize evidenced authentication, API, and database flow. State when a flow is not visible in the retrieved evidence.\n\n## Developer Onboarding\nName a practical starting point and the next files to inspect.\n\nRepository evidence (bounded):\n${context.slice(0, 7000)}`;

    const generated = await generateResponse(prompt, { maxCompletionTokens: 500 });
    return parseAnalysisSections(generated);
  } catch (error) {
    console.log(error);

    throw error;
  }
};
