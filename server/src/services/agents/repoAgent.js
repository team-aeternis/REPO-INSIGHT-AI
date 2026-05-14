

import { generateResponse } from "../llm/providers/openai.js";

import { dependencyTool } from "./tools/dependencyTool.js";

import { entryPointTool } from "./tools/entryPointTool.js";

import { repoSearchTool } from "./tools/repoSearchTool.js";

import { extractModules } from "../parser/extractModules.js";
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

${JSON.stringify(dependencies, null, 2)}
`;
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

${JSON.stringify(entryPoints, null, 2)}
`;

      navigationHelp = entryPoints.map((entry) => ({
        title: "Application Entry Point",

        file: entry.file || entry,
      }));
    } else if (
      lowerQuestion.includes("module") ||
      lowerQuestion.includes("feature") ||
      lowerQuestion.includes("section")
    ) {
      const modules = await extractModules(repositoryId);

      context = `

Repository Modules:

${JSON.stringify(modules, null, 2)}
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
${item.content}
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

You are an AI Repository Intelligence Agent.

Answer the user question ONLY using the provided repository context.

If answer is not grounded in context,
say:
"I could not find enough repository evidence."

Rules:
- Keep answer concise
- Mention important files
- Explain clearly for developers
- Do not hallucinate missing architecture
- Use grounded repository evidence only
- Limit answer to 4 short paragraphs maximum
- Avoid repeating file names excessively

Repository Context:

${context}

User Question:
${question}

Provide:
- concise explanation
- grounded references
- relevant file mentions
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
