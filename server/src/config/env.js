import dotenv from "dotenv";

dotenv.config();


export const env = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    llmApiKey: process.env.LLM_API_KEY,
    MONGODB_URL: process.env.MONGO_URL,
    DB_NAME: process.env.MONGO_DB_NAME,
    FRONTEND_URL: process.env.FRONTEND_URL,
    JWT_SECRET: process.env.JWT_SECRET || process.env.JWT_PASSWORD,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_NAME: process.env.ADMIN_NAME || "Repo Insight Admin",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
    
}
