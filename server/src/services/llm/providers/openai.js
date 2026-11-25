import OpenAI from "openai";

import { env } from "../../../config/env.js";
import { trackTokenUsage } from "../../observability/tokenTracker.js";
import { logObservability } from "../../observability/logger.js";
import { startTimer, getDurationMs } from "../../observability/metrics.js";

const MODEL_ID = "openai/gpt-oss-120b";

const client = new OpenAI({
  apiKey: env.llmApiKey,
  baseURL: "https://api.groq.com/openai/v1"
});

export const generateResponse = async (prompt, { onToken } = {}) => {
   const startedAt = startTimer();
   const messages = Array.isArray(prompt) ? prompt : [{ role: "user", content: prompt }];
   const input = messages.map((message) => `${message.role}: ${message.content}`).join("\n");

   try {
        let output = "";
        if (onToken) {
          const stream = await client.chat.completions.create({
            model: MODEL_ID,
            reasoning_effort: "low",
            max_completion_tokens: 700,
            messages,
            stream: true,
          });
          for await (const part of stream) {
            const token = part.choices?.[0]?.delta?.content || "";
            if (token) {
              output += token;
              onToken(token);
            }
          }
        } else {
          const response = await client.chat.completions.create({
            model: MODEL_ID,
            reasoning_effort: "low",
            max_completion_tokens: 700,
            messages,
          });
          output = response.choices?.[0]?.message?.content || "";
        }

        if (!output.trim()) throw new Error("The AI provider returned an empty answer.");
        const tokens = trackTokenUsage({ input, output });

        void logObservability({
          endpoint: "LLM generateResponse",
          modelUsed: MODEL_ID,
          inputTokens: tokens.inputTokens,
          outputTokens: tokens.outputTokens,
          responseTime: getDurationMs(startedAt),
          status: "success",
        });

        return output;

   } catch (error) {
        const tokens = trackTokenUsage({ input, output: "" });
        void logObservability({
          endpoint: "LLM generateResponse",
          modelUsed: MODEL_ID,
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

