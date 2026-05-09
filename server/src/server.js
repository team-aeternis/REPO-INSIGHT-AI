import app from "./app.js";
import http from "http";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";

const PORT = env.PORT;

const server = http.createServer(app);

const startServer = async () => {
await connectDB();
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
