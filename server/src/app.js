import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";

import { globalErrorHandler } from "./middleware/errorHandler.js";

// Routes -

import { chatRouter } from "./routes/chat.routes.js";
import { repositoryRouter } from "./routes/repository.routes.js";
import { analyzeRouter } from "./routes/analyze.routes.js";
import { evaluationRouter } from "./routes/evaluation.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { observabilityRouter } from "./routes/observability.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { requireAdmin, requireAuth, requireTermsAccepted } from "./middleware/auth.middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);



app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use("/api", apiRateLimiter);

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/repo", repositoryRouter);
app.use("/api/analyze", analyzeRouter);
app.use("/api/evaluation", requireAuth, requireTermsAccepted, requireAdmin, evaluationRouter);
app.use("/api/health", healthRouter);
app.use("/api/observability", requireAuth, requireTermsAccepted, requireAdmin, observabilityRouter);

app.use(globalErrorHandler);

export default app;
