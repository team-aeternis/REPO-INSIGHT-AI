import cosineSimilarity
from "compute-cosine-similarity";

import EmbeddingChunkModel
from "../../models/EmbeddingChunk.model.js";

import { createEmbedding }
from "../llm/providers/huggingFace.js";

export const similaritySearch =
async (

   repositoryId,

   query,

   topK = 5

) => {

   let queryEmbedding = null;
   try {
      queryEmbedding =
         await createEmbedding(
            query,
            {
               retries: 2,
               baseDelayMs: 500
            }
         );
   } catch (error) {
      console.warn(
         `[SimilaritySearch] Query embedding unavailable for "${query}". Returning empty results.`
      );
      return [];
   }

   const chunks =
      await EmbeddingChunkModel.find({

         repositoryId
      })
         .select("chunkText embeddingVector metadata.filePath")
         .lean();

   const scoredChunks =
      chunks.map(chunk => {

         const score =
            cosineSimilarity(

               queryEmbedding,

               chunk.embeddingVector
            );

         return {

            chunk,

            score
         };
      });

   scoredChunks.sort(

      (a, b) =>
         b.score - a.score
   );

   return scoredChunks
      .slice(0, topK);
};
