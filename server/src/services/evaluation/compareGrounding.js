export const compareGrounding = ({ answer = "", sources = [] } = {}) => {
  const text = String(answer || "").toLowerCase();
  const groundedFiles = (sources || []).filter((src) => {
    const file = String(src || "").toLowerCase();
    if (!file) return false;
    const base = file.split("/").pop();
    return text.includes(file) || (base && text.includes(base));
  });

  const ratio = sources.length ? groundedFiles.length / sources.length : 0;
  const groundingScore = Math.round(ratio * 100);

  return {
    groundingScore,
    groundedFiles,
    hasGrounding: groundedFiles.length > 0,
  };
};
