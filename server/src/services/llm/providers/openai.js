import OpenAI from "openai";

import { env } from "../../../config/env.js";

const client = new OpenAI({
  apiKey: env.llmApiKey,
  baseURL: "https://api.groq.com/openai/v1"
});

export const generateResponse = async (prompt) => {

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

        return response.choices[0].message.content;

   } catch (error) {
        console.error("Error generating response from OpenAI API:", error);
        throw new Error("Failed to generate response from OpenAI API");
   }

}
