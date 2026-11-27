import fs from "fs";

import { chunkText } from "./chunkText.js";

import { createEmbeddings } from "../llm/providers/huggingFace.js";

export const generateEmbeddings = async (
  repositoryId,

  fileDocuments = [],
  entryPoints = [],
) => {
  const embeddingDocuments = [];
  let failedChunkCount = 0;
  let failedFileCount = 0;
  const chunksToEmbed = [];
  const MAX_CHUNKS_PER_FILE = 12;
  const MAX_TOTAL_CHUNKS = 5000;
  const EMBEDDING_BATCH_SIZE = 8;
  const ignoredDirectories = new Set([
    "node_modules", ".git", "dist", "build", "coverage", ".next",
    "vendor", "target", ".venv", "venv", "__pycache__",
  ]);
  const entryPointPaths = new Set(entryPoints
    .map((entry) => typeof entry === "string" ? entry : entry?.file)
    .filter(Boolean)
    .map((filePath) => String(filePath).replace(/\\/g, "/").toLowerCase()));
  const isIgnored = (fileDoc) => {
    const normalized = String(fileDoc.filePath || "").replace(/\\/g, "/");
    const parts = normalized.toLowerCase().split("/");
    return parts.some((part) => ignoredDirectories.has(part)) ||
      /(^|\/)(\.env(?:\.|$)|.*\.lock$)/i.test(normalized);
  };
  const priority = (fileDoc) => {
    const filePath = String(fileDoc.filePath || "").replace(/\\/g, "/").toLowerCase();
    const name = filePath.split("/").pop() || "";
    if (entryPointPaths.has(filePath)) return -1;
    if (/^(readme|contributing|architecture|package\.json|pyproject\.toml|go\.mod|cargo\.toml|pom\.xml)/.test(name)) return 0;
    if (/(^|\/)(src|app|lib|cmd|internal|pages|routes|controllers|services)(\/|$)/.test(filePath)) return 1;
    if (/\.(js|jsx|ts|tsx|py|go|rs|java|kt|rb|php|cs|cpp|h|hpp|c|vue|svelte)$/.test(name)) return 2;
    return 3;
  };
  const orderedFiles = fileDocuments
    .filter((fileDoc) => fileDoc?.filePath && !isIgnored(fileDoc))
    .sort((left, right) => priority(left) - priority(right) ||
      String(left.filePath).localeCompare(String(right.filePath)));

  for (const fileDoc of orderedFiles) {
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

  if (chunksToEmbed.length >= MAX_TOTAL_CHUNKS) {
    console.warn(`[Embedding] Reached the ${MAX_TOTAL_CHUNKS}-chunk indexing limit; remaining files were not indexed.`);
  }

  return embeddingDocuments;
};
