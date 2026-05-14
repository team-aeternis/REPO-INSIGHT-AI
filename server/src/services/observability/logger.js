import mongoose from "mongoose";
import ObservabilityModel from "../../models/Observability.model.js";

const normalizeObjectId = (value) => {
  if (!value) return undefined;
  if (mongoose.Types.ObjectId.isValid(String(value))) return value;
  return undefined;
};

export const logObservability = async (payload = {}) => {
  try {
    const doc = {
      repositoryId: normalizeObjectId(payload.repositoryId),
      endpoint: payload.endpoint || "unknown",
      modelUsed: payload.modelUsed || "unknown",
      inputTokens: Number(payload.inputTokens || 0),
      outputTokens: Number(payload.outputTokens || 0),
      responseTime: Number(payload.responseTime || 0),
      status: payload.status || "success",
      errorMessage: payload.errorMessage || "",
    };

    await ObservabilityModel.create(doc);
  } catch (error) {
    console.error("[Observability] Failed to store log:", error?.message || error);
  }
};
