import fs from "fs";

import { chunkText } from "./chunkText.js";

import { createEmbeddings } from "../llm/providers/huggingFace.js";

export const generateEmbeddings = async (
  repositoryId,

  fileDocuments = [],
) => {
  const embeddingDocuments = [];
  let failedChunkCount = 0;
  let failedFileCount = 0;
  const chunksToEmbed = [];
  const MAX_FILES = 180;
  const MAX_CHUNKS_PER_FILE = 6;
  const MAX_TOTAL_CHUNKS = 900;
  const EMBEDDING_BATCH_SIZE = 32;

  for (const fileDoc of fileDocuments.slice(0, MAX_FILES)) {
    const ignoredPatterns = [
      "node_modules",
      ".json",
      "utils",
      "validator",
      "constant",
      "config",
      ".env",
      "dist",
      "build",
      "coverage",
    ];

    const shouldIgnore = ignoredPatterns.some((pattern) =>
      fileDoc.filePath.toLowerCase().includes(pattern),
    );

    if (shouldIgnore) {
      continue;
    }
    try {
      const content = fs.readFileSync(
        fileDoc.filePath,

        "utf-8",
      );

      if (!content?.trim()) {
        continue;
      }

      const chunks = chunkText(content).slice(0, MAX_CHUNKS_PER_FILE);

      for (let i = 0; i < chunks.length; i++) {
        if (chunksToEmbed.length >= MAX_TOTAL_CHUNKS) {
          break;
        }
        chunksToEmbed.push({
          fileId: fileDoc._id,
          chunkText: chunks[i],
          chunkIndex: i,
          filePath: fileDoc.filePath,
          module: fileDoc.category,
        });
      }
      if (chunksToEmbed.length >= MAX_TOTAL_CHUNKS) {
        break;
      }
    } catch (error) {
      failedFileCount += 1;
    }
  }

  for (let start = 0; start < chunksToEmbed.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = chunksToEmbed.slice(start, start + EMBEDDING_BATCH_SIZE);

    try {
      const vectors = await createEmbeddings(batch.map((item) => item.chunkText));
      embeddingDocuments.push(
        ...batch.map((item, index) => ({
          repositoryId,
          fileId: item.fileId,
          chunkText: item.chunkText,
          chunkIndex: item.chunkIndex,
          embeddingVector: vectors[index],
          metadata: {
            filePath: item.filePath,
            module: item.module,
          },
        })),
      );
    } catch {
      failedChunkCount += batch.length;
    }
  }

  if (failedChunkCount > 0 || failedFileCount > 0) {
    console.warn(
      `[Embedding] Completed with partial failures. Failed chunks: ${failedChunkCount}, failed files: ${failedFileCount}, successful chunks: ${embeddingDocuments.length}`,
    );
  }

  if (chunksToEmbed.length > 0 && embeddingDocuments.length === 0) {
    throw new Error(
      "No repository chunks could be embedded. Check that the local embedding model can be downloaded and loaded.",
    );
  }

  return embeddingDocuments;
};
