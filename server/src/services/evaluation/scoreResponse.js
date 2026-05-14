export const scoreResponse = ({ question = "", answer = "" } = {}) => {
  const q = String(question || "").trim();
  const a = String(answer || "").trim();

  if (!a) {
    return { score: 0, passed: false, reason: "Empty answer" };
  }

  let score = 0;

  if (a.length >= 40) score += 25;
  if (a.length >= 120) score += 15;
  if (/`[^`]+`/.test(a)) score += 20; // grounded path/code references
  if (/-\s|\d+\.\s/.test(a)) score += 10; // structured readability
  if (/could not find enough repository evidence/i.test(a)) score += 10; // safe fallback
  if (q && a.toLowerCase().includes(q.split(" ")[0]?.toLowerCase())) score += 10;

  score = Math.min(100, score);
  return {
    score,
    passed: score >= 55,
    reason: score >= 55 ? "Answer quality acceptable" : "Answer quality below threshold",
  };
};
