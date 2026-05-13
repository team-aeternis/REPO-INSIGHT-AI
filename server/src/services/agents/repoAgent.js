import { similaritySearch }
from "../vector/similaritySearch.js";

import { generateResponse }
from "../llm/providers/openai.js";

export const repoAgent =
async (

   repositoryId,

   question

) => {

   // retrieve relevant chunks

   const relevantChunks =
      await similaritySearch(

         repositoryId,

         question,

         5
      );

   // prepare context

   const context =
      relevantChunks.map(

         ({ chunk }, index) => `

FILE:
${chunk.metadata.filePath}

CODE CHUNK:
${chunk.chunkText}

`
      ).join("\n");

   // final prompt

   const prompt = `

You are an AI Repository Intelligence Agent.

Answer the user question ONLY using the provided repository context.

If answer is not grounded in context,
say:
"I could not find enough repository evidence."

Repository Context:

${context}

User Question:
${question}

Provide:
- concise explanation
- grounded references
- mention relevant files

`;

   // generate grounded answer

   const response =
      await generateResponse(
         prompt
      );

   return {

      answer: response,

      sources:
         relevantChunks.map(

            ({ chunk }) => (

               chunk.metadata.filePath
            )
         )
   };
};