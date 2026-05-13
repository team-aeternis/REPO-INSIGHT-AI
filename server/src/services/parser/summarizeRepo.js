import RepositoryModel from "../../models/Repository.model.js";

import DependencyModel from "../../models/Dependency.model.js";

import FileModel from "../../models/File.model.js";

import { similaritySearch } from "../vector/similaritySearch.js";

import { generateResponse } from "../llm/providers/openai.js";

export const summarizeRepo = async (repositoryId) => {
  try {
    // repository metadata

    const repository = await RepositoryModel.findById(repositoryId);

    const dependencies = await DependencyModel.find({
      repositoryId,
    });

    const files = await FileModel.find({
      repositoryId,
    });

    // semantic retrieval

    const architectureChunks = await similaritySearch(
      repositoryId,

      "project architecture",
    );

    const authChunks = await similaritySearch(
      repositoryId,

      "authentication flow",
    );

    const databaseChunks = await similaritySearch(
      repositoryId,

      "database connection",
    );

    // build semantic context

    const context = `

Repository Name:
${repository.repoName}

Dependencies:
${dependencies.map((dep) => dep.name).join(", ")}

Architecture Chunks:
${architectureChunks.map((item) => item.chunk.chunkText).join("\n\n")}

Authentication Chunks:
${authChunks.map((item) => item.chunk.chunkText).join("\n\n")}

Database Chunks:
${databaseChunks.map((item) => item.chunk.chunkText).join("\n\n")}
`;

    // prompt

    const prompt = `

You are a repository intelligence assistant.

Analyze this repository and generate:

1. Architecture summary
2. Tech stack summary
3. Important modules
4. Authentication flow
5. Database flow
6. Recommended starting files
7. Developer onboarding guidance

Repository Context:

${context}

Keep response:
- concise
- developer friendly
- grounded in repository
`;

    // generate summary

    const summary = await generateResponse(prompt);

    return summary;
  } catch (error) {
    console.log(error);

    throw error;
  }
};
