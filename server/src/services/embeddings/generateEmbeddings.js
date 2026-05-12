import fs from "fs";

import { chunkText }
from "./chunkText.js";

import { createEmbedding }
from "../llm/providers/huggingFace.js";

export const generateEmbeddings =
async (

   repositoryId,

   fileDocuments = []

) => {

   const embeddingDocuments = [];

   for (

      const fileDoc of fileDocuments

   ) {

      try {

         const content =
            fs.readFileSync(

               fileDoc.filePath,

               "utf-8"
            );

         if (!content?.trim()) {
            continue;
         }

         const chunks =
            chunkText(content);

         for (

            let i = 0;

            i < chunks.length;

            i++

         ) {

            const chunk =
               chunks[i];

            const embedding =
               await createEmbedding(
                  chunk
               );

            embeddingDocuments.push({

               repositoryId,

               fileId:
                  fileDoc._id,

               chunkText:
                  chunk,

               chunkIndex: i,

               embeddingVector:
                  embedding,

               metadata: {

                  filePath:
                     fileDoc.filePath,

                  module:
                     fileDoc.category
               }
            });
         }

      } catch (error) {

         console.log(

            `Embedding failed for ${fileDoc.filePath}`
         );
      }
   }

   return embeddingDocuments;
};