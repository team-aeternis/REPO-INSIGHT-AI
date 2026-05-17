import fs from "fs";

import { chunkText } from "./chunkText.js";

import { createEmbedding } from "../llm/providers/huggingFace.js";

export const generateEmbeddings = async (
  repositoryId,

  fileDocuments = [],
) => {
  const embeddingDocuments = [];
  let failedChunkCount = 0;
  let failedFileCount = 0;
  const MAX_FILES = 180;
  const MAX_CHUNKS_PER_FILE = 6;
  const MAX_TOTAL_CHUNKS = 900;

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
        if (embeddingDocuments.length >= MAX_TOTAL_CHUNKS) {
          break;
        }
        const chunk = chunks[i];

        try {
          const embedding = await createEmbedding(chunk, {
            retries: 2,
            baseDelayMs: 600,
          });

          embeddingDocuments.push({
            repositoryId,

            fileId: fileDoc._id,

            chunkText: chunk,

            chunkIndex: i,

            embeddingVector: embedding,

            metadata: {
              filePath: fileDoc.filePath,

              module: fileDoc.category,
            },
          });

          // Small throttle to reduce provider burst while keeping processing practical.
          await new Promise((resolve) => setTimeout(resolve, 120));
        } catch (error) {
          failedChunkCount += 1;

          continue;
        }
      }
      if (embeddingDocuments.length >= MAX_TOTAL_CHUNKS) {
        break;
      }
    } catch (error) {
      failedFileCount += 1;
    }
  }

  if (failedChunkCount > 0 || failedFileCount > 0) {
    console.warn(
      `[Embedding] Completed with partial failures. Failed chunks: ${failedChunkCount}, failed files: ${failedFileCount}, successful chunks: ${embeddingDocuments.length}`,
    );
  }

  return embeddingDocuments;
};
