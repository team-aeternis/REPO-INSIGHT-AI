import EmbeddingChunkModel from "../../models/EmbeddingChunk.model.js";
import { createEmbeddings } from "../llm/providers/huggingFace.js";
import { rankChunks, tokenize } from "./retrievalScoring.js";

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHED_REPOSITORIES = 5;
const MAX_CACHED_QUERY_EMBEDDINGS = 128;
const repositoryChunkCache = new Map();
const queryEmbeddingCache = new Map();

const loadRepositoryChunks = async (repositoryId) => {
  const key = String(repositoryId);
  const cached = repositoryChunkCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    repositoryChunkCache.delete(key);
    repositoryChunkCache.set(key, cached);
    return cached.chunks;
  }

  const documents = await EmbeddingChunkModel.find({ repositoryId })
    .select("chunkText embeddingVector metadata.filePath metadata.module")
    .lean();
  const chunks = documents
    .filter((document) => Array.isArray(document.embeddingVector) && document.embeddingVector.length > 0)
    .map((document) => ({
      chunkText: document.chunkText || "",
      filePath: document.metadata?.filePath || "",
      module: document.metadata?.module || "",
      vector: Float32Array.from(document.embeddingVector),
      terms: tokenize(`${document.metadata?.filePath || ""} ${document.metadata?.module || ""} ${document.chunkText || ""}`),
      pathTerms: tokenize(document.metadata?.filePath || ""),
    }));

  repositoryChunkCache.set(key, { chunks, expiresAt: Date.now() + CACHE_TTL_MS });
  while (repositoryChunkCache.size > MAX_CACHED_REPOSITORIES) {
    repositoryChunkCache.delete(repositoryChunkCache.keys().next().value);
  }
  return chunks;
};

export const invalidateRepositoryChunkCache = (repositoryId) => {
  repositoryChunkCache.delete(String(repositoryId));
};

const getQueryEmbeddings = async (queries) => {
  const now = Date.now();
  const missing = [];
  const missingIndexes = [];
  const embeddings = new Array(queries.length);

  queries.forEach((query, index) => {
    const key = String(query).trim().toLowerCase();
    const cached = queryEmbeddingCache.get(key);
    if (cached && cached.expiresAt > now) {
      queryEmbeddingCache.delete(key);
      queryEmbeddingCache.set(key, cached);
      embeddings[index] = cached.embedding;
    } else {
      missing.push(query);
      missingIndexes.push({ index, key });
    }
  });

  if (missing.length) {
    const computed = await createEmbeddings(missing);
    computed.forEach((embedding, index) => {
      const { index: queryIndex, key } = missingIndexes[index];
      embeddings[queryIndex] = embedding;
      queryEmbeddingCache.set(key, { embedding, expiresAt: now + CACHE_TTL_MS });
    });
    while (queryEmbeddingCache.size > MAX_CACHED_QUERY_EMBEDDINGS) {
      queryEmbeddingCache.delete(queryEmbeddingCache.keys().next().value);
    }
  }
  return embeddings;
};

export const similaritySearchMany = async (
  repositoryId,
  queries = [],
  topK = 5,
) => {
  if (!queries.length) return [];

  const queryEmbeddings = await getQueryEmbeddings(queries);
  const chunks = await loadRepositoryChunks(repositoryId);

  return queryEmbeddings.map((queryEmbedding, queryIndex) =>
    rankChunks(queryEmbedding, chunks, queries[queryIndex], topK),
  );
};

export const similaritySearch = async (repositoryId, query, topK = 5) => {
  try {
    const [results] = await similaritySearchMany(repositoryId, [query], topK);
    return results || [];
  } catch (error) {
    console.warn(
      `[SimilaritySearch] Query embedding unavailable for "${query}". Returning empty results.`,
    );
    return [];
  }
};
