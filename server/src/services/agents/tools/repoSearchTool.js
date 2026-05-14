import { similaritySearch }
from "../../vector/similaritySearch.js";

export const repoSearchTool =
async (

   repositoryId,
   query
) => {

   const results =
      await similaritySearch(

         repositoryId,
         query
      );

   return results.map(

      item => ({

         filePath:
            item.chunk.metadata
               ?.filePath,

         content:
            item.chunk.chunkText
      })
   );
};