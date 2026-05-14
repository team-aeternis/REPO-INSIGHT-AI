import { startTimer, getDurationMs } from "../services/observability/metrics.js";
import { logObservability } from "../services/observability/logger.js";
import { emitTelemetry } from "../services/observability/telemetry.js";

const extractRepositoryId = (req) =>
  req?.body?.repositoryId || req?.params?.repositoryId || req?.params?.id;

export const requestLogger = (req, res, next) => {
  const startedAt = startTimer();

  res.on("finish", async () => {
    const responseTime = getDurationMs(startedAt);
    const status = res.statusCode >= 400 ? "failed" : "success";
    const endpoint = `${req.method} ${req.originalUrl}`;

    await logObservability({
      repositoryId: extractRepositoryId(req),
      endpoint,
      status,
      responseTime,
      errorMessage: status === "failed" ? `HTTP ${res.statusCode}` : "",
    });

    emitTelemetry("request.completed", {
      endpoint,
      statusCode: res.statusCode,
      responseTime,
    });
  });

  next();
};
