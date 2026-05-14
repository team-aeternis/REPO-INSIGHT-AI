export const estimateTokens = (text = "") => {
  if (!text || typeof text !== "string") return 0;
  // Lightweight approximation: ~4 chars/token for English/code mix.
  return Math.ceil(text.length / 4);
};

export const trackTokenUsage = ({ input = "", output = "" } = {}) => ({
  inputTokens: estimateTokens(input),
  outputTokens: estimateTokens(output),
});
