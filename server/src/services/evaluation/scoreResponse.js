export const scoreResponse = ({ question = "", answer = "" } = {}) => {
  const q = String(question || "").trim();
  const a = String(answer || "").trim();

  if (!a) {
    return { score: 0, passed: false, reason: "Empty answer" };
  }

  const fallback = /could not find enough repository evidence|not available yet|no .* records for this repository/i.test(a);
  const failed = /^(error|failed|internal server error|unable to generate)/i.test(a);
  if (failed) {
    return { score: 0, passed: false, reason: "The response reports a processing failure" };
  }

  let score = 10;
  if (a.length >= 40) score += 10;
  if (a.length >= 120) score += 10;
  if (a.length >= 300) score += 5;
  if (/`[^`]+`/.test(a)) score += 20;
  if (/^\s*(?:#{1,3}\s|[-*]\s|\d+\.\s)/m.test(a)) score += 10;
  if (/[.!?](?:\s|$)/.test(a)) score += 10;
  if (q && a.length > 0) score += 5;
  if (fallback) score = Math.min(score, 35);
  score = Math.min(100, score);
  return {
    score,
    passed: score >= 55,
    reason: fallback
      ? "The repository has insufficient indexed evidence for a complete answer"
      : score >= 55
        ? "Answer is readable and includes useful evidence"
        : "Answer is too short or lacks supporting detail",
  };
};
