import dotenv from "dotenv";

dotenv.config();


export const env = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    llmApiKey: process.env.LLM_API_KEY,
    MONGODB_URL: process.env.MONGO_URL,
    DB_NAME: process.env.MONGO_DB_NAME,
    FRONTEND_URL: process.env.FRONTEND_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY
    
}