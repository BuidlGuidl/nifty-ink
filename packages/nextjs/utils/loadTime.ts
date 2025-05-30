export const calculateLoadTimeOffset = (totalLines: number): number => {
  if (totalLines === 0) return 0; // Instant loading
  if (totalLines < 10) return 5;
  if (totalLines < 50) return 2;
  if (totalLines < 100) return 0.5;
  return 10 / totalLines;
};
