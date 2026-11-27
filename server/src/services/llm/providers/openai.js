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

export const generateResponse = async (prompt, { onToken, maxCompletionTokens = 700 } = {}) => {
   const startedAt = startTimer();
   const messages = Array.isArray(prompt) ? prompt : [{ role: "user", content: prompt }];
   const input = messages.map((message) => `${message.role}: ${message.content}`).join("\n");

   try {
        let output = "";
        if (onToken) {
          const stream = await client.chat.completions.create({
            model: MODEL_ID,
            reasoning_effort: "low",
            max_completion_tokens: maxCompletionTokens,
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
            max_completion_tokens: maxCompletionTokens,
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
        const providerStatus = Number(error?.status || error?.statusCode);
        const isTokenLimit = error?.type === "tokens" ||
          error?.error?.type === "tokens" ||
          /tokens per minute|request too large for model/i.test(error?.message || "");
        const retryAfter = Number(error?.headers?.get?.("retry-after"));
        const waitMessage = Number.isFinite(retryAfter) && retryAfter > 0
          ? ` Wait about ${Math.ceil(retryAfter)} seconds before retrying.`
          : " Please retry shortly.";
        const statusCode = isTokenLimit || providerStatus === 429
          ? 429
          : providerStatus === 413
            ? 413
            : 502;
        const message = isTokenLimit
          ? `The AI provider's token budget is temporarily exhausted.${waitMessage}`
          : providerStatus === 429
            ? `The AI provider is temporarily rate limited.${waitMessage}`
            : "The AI provider could not generate a response. Please try again.";

        void logObservability({
          endpoint: "LLM generateResponse",
          modelUsed: MODEL_ID,
          inputTokens: tokens.inputTokens,
          outputTokens: 0,
          responseTime: getDurationMs(startedAt),
          status: "failed",
          errorMessage: message,
        });
        console.error("LLM provider request failed:", {
          status: providerStatus || null,
          code: error?.code || null,
          type: error?.type || error?.error?.type || null,
        });
        const mappedError = new Error(message);
        mappedError.statusCode = statusCode;
        throw mappedError;
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

