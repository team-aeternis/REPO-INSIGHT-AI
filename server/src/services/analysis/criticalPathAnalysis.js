import RepositoryModel
from "../../models/Repository.model.js";

import FileModel
from "../../models/File.model.js";

import AnalyzeResultModel
from "../../models/AnalyzeResult.model.js";

import { similaritySearchMany }
from "../vector/similaritySearch.js";

import { generateResponse }
from "../llm/providers/openai.js";

export const criticalPathAnalysis =
async (repositoryId, retrievedChunks = null, { persist = true } = {}) => {

   try {

      // repository

      const [repository, files, semanticChunks] = await Promise.all([
         RepositoryModel.findById(repositoryId)
            .select("repoName entryPoints")
            .lean(),
         FileModel.find({ repositoryId })
            .select("filePath category")
            .lean(),
         retrievedChunks || similaritySearchMany(repositoryId, [
            "authentication flow jwt login middleware",
            "api routing request handling controllers",
            "database connection mongoose sequelize queries",
            "frontend routing react pages components",
            "analysis pipeline processing services",
         ]),
      ]);

      if (!repository) {

         throw new Error(
            "Repository not found"
         );
      }

      // important files

      // entry points

      const entryPoints =
         repository.entryPoints || [];

      // semantic retrieval

      const [
         authChunks,
         routingChunks,
         databaseChunks,
         frontendChunks,
         analysisChunks,
      ] = semanticChunks;

      // categorized files

      const routes =
         files.filter(

            file =>
               file.category === "route"
         );

      const controllers =
         files.filter(

            file =>
               file.category === "controller"
         );

      const services =
         files.filter(

            file =>
               file.category === "service"
         );

      const middleware =
         files.filter(

            file =>
               file.category === "middleware"
         );

      // build context

      const context = `

Repository:
${repository.repoName}

Entry Points:
${entryPoints
   .map(

      entry => entry.file || entry
   )
   .join("\n")}

Routes:
${routes
   .map(

      file => file.filePath
   )
   .join("\n")}

Controllers:
${controllers
   .map(

      file => file.filePath
   )
   .join("\n")}

Services:
${services
   .map(

      file => file.filePath
   )
   .join("\n")}

Middleware:
${middleware
   .map(

      file => file.filePath
   )
   .join("\n")}

Authentication Chunks:
${authChunks
   .map(

      item =>
         item.chunk.chunkText
   )
   .join("\n\n")}

Routing Chunks:
${routingChunks
   .map(

      item =>
         item.chunk.chunkText
   )
   .join("\n\n")}

Database Chunks:
${databaseChunks
   .map(

      item =>
         item.chunk.chunkText
   )
   .join("\n\n")}

Frontend Chunks:
${frontendChunks
   .map(

      item =>
         item.chunk.chunkText
   )
   .join("\n\n")}

Analysis Chunks:
${analysisChunks
   .map(

      item =>
         item.chunk.chunkText
   )
   .join("\n\n")}
`;

      // prompt

      const prompt = `

You are a senior software architect.

Analyze the repository context and generate:

1. Authentication execution flow
2. API request lifecycle
3. Frontend execution flow
4. Database interaction flow
5. Important critical execution paths
6. Recommended onboarding flow for developers

Rules:
- Keep response concise
- Use repository grounded information only
- Do NOT hallucinate technologies
- Mention important files involved
- Explain request flow step-by-step

Repository Context:

${context}
`;

      // llm response

      const criticalPaths =
         await generateResponse(
            prompt
         );

      // save/update analysis result

      if (persist) {
         await AnalyzeResultModel.findOneAndUpdate(
            { repositoryId },
            { criticalPathAnalysis: criticalPaths },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
         );
      }

      return criticalPaths;

   } catch (error) {

      console.log(
         "Critical Path Analysis Error:",
         error
      );

      throw error;
   }
};
