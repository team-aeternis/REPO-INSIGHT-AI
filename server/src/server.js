import app from "./app.js";
import http from "http";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createEmbedding} from "./services/llm/providers/huggingFace.js";
import { provisionConfiguredAdmin } from "./services/auth/auth.service.js";
import { migrateUserScopedData } from "./services/migrations/userDataIsolation.js";

const PORT = env.PORT;

const server = http.createServer(app);

// createEmbedding("hello world");

const startServer = async () => {
await connectDB();
  await provisionConfiguredAdmin();
  await migrateUserScopedData();
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
