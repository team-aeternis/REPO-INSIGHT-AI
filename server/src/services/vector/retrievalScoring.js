export const tokenize = (value = "") =>
  new Set(
    String(value)
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .replace(/[^a-z0-9_./-]+/g, " ")
      .split(/[\s_./-]+/)
      .filter((token) => token.length > 2),
  );

const dotProduct = (left, right) => {
  if (!left || left.length !== right?.length) return Number.NEGATIVE_INFINITY;
  let score = 0;
  for (let index = 0; index < left.length; index += 1) {
    score += left[index] * right[index];
  }
  return Number.isFinite(score) ? score : Number.NEGATIVE_INFINITY;
};

const lexicalScore = (queryTerms, chunk) => {
  if (!queryTerms.size) return 0;
  let matchedWeight = 0;
  for (const term of queryTerms) {
    if (chunk.pathTerms.has(term)) matchedWeight += 2;
    else if (chunk.terms.has(term)) matchedWeight += 1;
  }
  return Math.min(1, matchedWeight / (queryTerms.size * 1.5));
};

export const rankChunks = (queryEmbedding, chunks, query, topK = 5) => {
  const queryTerms = tokenize(query);
  const ranked = chunks
    .map((chunk) => {
      const semantic = dotProduct(queryEmbedding, chunk.vector);
      const lexical = lexicalScore(queryTerms, chunk);
      return {
        chunk: {
          chunkText: chunk.chunkText,
          metadata: { filePath: chunk.filePath, module: chunk.module },
        },
        score: Math.max(0, semantic) * 0.72 + lexical * 0.28,
      };
    })
    .filter((item) => Number.isFinite(item.score))
    .sort((left, right) => right.score - left.score);

  const selected = [];
  const files = new Map();
  for (const item of ranked) {
    const filePath = item.chunk.metadata.filePath;
    const count = files.get(filePath) || 0;
    if (count >= 2) continue;
    selected.push(item);
    files.set(filePath, count + 1);
    if (selected.length >= topK) break;
  }
  return selected;
};
