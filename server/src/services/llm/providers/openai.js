import OpenAI from "openai";

import { env } from "../../../config/env.js";
import { trackTokenUsage } from "../../observability/tokenTracker.js";
import { logObservability } from "../../observability/logger.js";
import { startTimer, getDurationMs } from "../../observability/metrics.js";

const client = new OpenAI({
  apiKey: env.llmApiKey,
  baseURL: "https://api.groq.com/openai/v1"
});

export const generateResponse = async (prompt) => {
   const startedAt = startTimer();

   try {
        const response = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        const output = response.choices?.[0]?.message?.content || "";
        const tokens = trackTokenUsage({ input: prompt, output });

        await logObservability({
          endpoint: "LLM generateResponse",
          modelUsed: "llama-3.3-70b-versatile",
          inputTokens: tokens.inputTokens,
          outputTokens: tokens.outputTokens,
          responseTime: getDurationMs(startedAt),
          status: "success",
        });

        return output;

   } catch (error) {
        const tokens = trackTokenUsage({ input: prompt, output: "" });
        await logObservability({
          endpoint: "LLM generateResponse",
          modelUsed: "llama-3.3-70b-versatile",
          inputTokens: tokens.inputTokens,
          outputTokens: 0,
          responseTime: getDurationMs(startedAt),
          status: "failed",
          errorMessage: error?.message || "LLM call failed",
        });
        console.error("Error generating response from OpenAI API:", error);
        throw new Error("Failed to generate response from OpenAI API");
   }

}


// const client = new OpenAI({

//    apiKey: env.OPENAI_API_KEY
      
// });

// export const createEmbedding =
// async (text) => {

//    try {

//       const response =
//          await client.embeddings.create({

//             model:
//                "text-embedding-3-small",

//             input: text
//          });

//       return response
//          .data[0]
//          .embedding;

//    } catch (error) {

//       console.error(
//          "Embedding Error:",
//          error
//       );

//       throw new Error(
//          "Failed to generate embedding"
//       );
//    }
// };

// export const embedding =
//    await createEmbedding(
//       "hello world"
//    );

// console.log(
//    embedding.length
// );

