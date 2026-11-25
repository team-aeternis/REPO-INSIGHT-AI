import app from "./app.js";
import http from "http";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { provisionConfiguredAdmin } from "./services/auth/auth.service.js";
import { migrateUserScopedData } from "./services/migrations/userDataIsolation.js";

const PORT = env.PORT || 8080;

const server = http.createServer(app);

const startServer = async () => {
  const requiredEnvironment = [
    ["MONGO_URL", env.MONGODB_URL],
    ["JWT_SECRET", env.JWT_SECRET],
    ["FRONTEND_URL", env.FRONTEND_URL],
    ["LLM_API_KEY", env.llmApiKey],
  ];
  const missingEnvironment = requiredEnvironment
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingEnvironment.length) {
    throw new Error(`Missing required environment variables: ${missingEnvironment.join(", ")}`);
  }

  await connectDB();
  await provisionConfiguredAdmin();
  await migrateUserScopedData();
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
