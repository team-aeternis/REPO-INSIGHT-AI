import {
   HfInference
}
from "@huggingface/inference";

import { env }
from "../../../config/env.js";

const client =
   new HfInference(

      env.HUGGINGFACE_API_KEY
   );

export const createEmbedding =
async (text) => {

   try {

      if (!text?.trim()) {

         throw new Error(
            "Text is required for embedding"
         );
      }

      const embedding =
         await client.featureExtraction({

            provider:
            "hf-inference",

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