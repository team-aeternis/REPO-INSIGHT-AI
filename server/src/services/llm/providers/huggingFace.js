import {
   HfInference
}
from "@huggingface/inference";

import { env }
from "../../../config/env.js";
import { trackTokenUsage } from "../../observability/tokenTracker.js";
import { logObservability } from "../../observability/logger.js";
import { startTimer, getDurationMs } from "../../observability/metrics.js";

const client =
   new HfInference(

      env.HUGGINGFACE_API_KEY
   );

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
   const status = error?.httpResponse?.status;
   if ([408, 429, 500, 502, 503, 504].includes(status)) return true;
   return !status;
};

export const createEmbedding =
async (text, options = {}) => {
   const startedAt = startTimer();

   const {
      retries = 3,
      baseDelayMs = 700
   } = options;

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
      if (!isRetryableError(error) || retries <= 0) {
         const status = error?.httpResponse?.status || "unknown";
         const message = error?.message || "Embedding request failed";
         const tokens = trackTokenUsage({ input: text, output: "" });
         await logObservability({
            endpoint: "HF featureExtraction",
            modelUsed: "sentence-transformers/all-MiniLM-L6-v2",
            inputTokens: tokens.inputTokens,
            outputTokens: 0,
            responseTime: getDurationMs(startedAt),
            status: "failed",
            errorMessage: `HTTP ${status}: ${message}`
         });
         console.error(`HF Embedding Error (${status}): ${message}`);
         throw error;
      }

      const attempt = 4 - retries;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(delay);
      return createEmbedding(text, {
         retries: retries - 1,
         baseDelayMs
      });
   }
};
