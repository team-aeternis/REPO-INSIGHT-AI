export const startTimer = () => Date.now();

export const getDurationMs = (startAt) => {
  if (!startAt) return 0;
  return Math.max(0, Date.now() - startAt);
};
