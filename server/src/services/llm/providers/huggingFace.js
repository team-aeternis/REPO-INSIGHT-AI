import {
   HfInference
}
from "@huggingface/inference";

const client =
   new HfInference(

      process.env
         .HUGGINGFACE_API_KEY
   );

export const createEmbedding =
async (text) => {

   try {

      const embedding =
         await client.featureExtraction({

            model:
            "sentence-transformers/all-MiniLM-L6-v2",

            inputs: text
         });

      return embedding;

   } catch (error) {

      console.error(
         "HF Embedding Error:",
         error
      );

      throw error;
   }
};