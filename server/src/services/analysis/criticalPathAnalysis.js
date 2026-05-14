import RepositoryModel
from "../../models/Repository.model.js";

import FileModel
from "../../models/File.model.js";

import AnalyzeResultModel
from "../../models/AnalyzeResult.model.js";

import { similaritySearch }
from "../vector/similaritySearch.js";

import { generateResponse }
from "../llm/providers/openai.js";

export const criticalPathAnalysis =
async (repositoryId) => {

   try {

      // repository

      const repository =
         await RepositoryModel.findById(
            repositoryId
         );

      if (!repository) {

         throw new Error(
            "Repository not found"
         );
      }

      // important files

      const files =
         await FileModel.find({

            repositoryId
         });

      // entry points

      const entryPoints =
         repository.entryPoints || [];

      // semantic retrieval

      const authChunks =
         await similaritySearch(

            repositoryId,

            "authentication flow jwt login middleware"
         );

      const routingChunks =
         await similaritySearch(

            repositoryId,

            "api routing request handling controllers"
         );

      const databaseChunks =
         await similaritySearch(

            repositoryId,

            "database connection mongoose sequelize queries"
         );

      const frontendChunks =
         await similaritySearch(

            repositoryId,

            "frontend routing react pages components"
         );

      const analysisChunks =
         await similaritySearch(

            repositoryId,

            "analysis pipeline processing services"
         );

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

      const existingAnalysis =
         await AnalyzeResultModel.findOne({

            repositoryId
         });

      if (existingAnalysis) {

         existingAnalysis
            .criticalPathAnalysis =
               criticalPaths;

         await existingAnalysis.save();

      } else {

         await AnalyzeResultModel.create({

            repositoryId,

            criticalPathAnalysis:
               criticalPaths
         });
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