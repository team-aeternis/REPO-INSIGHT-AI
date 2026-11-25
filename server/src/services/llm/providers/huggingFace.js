import { pipeline } from "@huggingface/transformers";

import { trackTokenUsage } from "../../observability/tokenTracker.js";
import { logObservability } from "../../observability/logger.js";
import { startTimer, getDurationMs } from "../../observability/metrics.js";

const MODEL_ID = "onnx-community/all-MiniLM-L6-v2-ONNX";
const EMBEDDING_DIMENSIONS = 384;

let extractorPromise;

const getExtractor = () => {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", MODEL_ID).catch((error) => {
      extractorPromise = undefined;
      throw error;
    });
  }

  return extractorPromise;
};

export const createEmbeddings = async (texts) => {
  const startedAt = startTimer();

  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error("At least one text is required for embedding");
    }
    if (texts.some((text) => typeof text !== "string" || !text.trim())) {
      throw new Error("All embedding inputs must be non-empty text");
    }

    const extractor = await getExtractor();
    const output = await extractor(texts, {
      pooling: "mean",
      normalize: true,
    });
    const embeddings = output.tolist();

    if (embeddings.length !== texts.length || embeddings.some((embedding) =>
      embedding.length !== EMBEDDING_DIMENSIONS ||
      embedding.some((value) => !Number.isFinite(value))
    )) {
      throw new Error(
        `Embedding model returned invalid vectors (expected ${texts.length} vectors of ${EMBEDDING_DIMENSIONS} finite values)`,
      );
    }

    return embeddings;
  } catch (error) {
    const input = Array.isArray(texts) ? texts.join("\n") : "";
    const tokens = trackTokenUsage({ input, output: "" });
    await logObservability({
      endpoint: "Local featureExtraction",
      modelUsed: MODEL_ID,
      inputTokens: tokens.inputTokens,
      outputTokens: 0,
      responseTime: getDurationMs(startedAt),
      status: "failed",
      errorMessage: error?.message || "Local embedding failed",
    });
    console.error(`Local embedding error: ${error?.message || error}`);
    throw error;
  }
};

export const createEmbedding = async (text) => {
  const [embedding] = await createEmbeddings([text]);
  return embedding;
};
