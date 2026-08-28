type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

export function synchronizedScrollTop(
  source: ScrollMetrics,
  target: ScrollMetrics,
) {
  const sourceRange = Math.max(0, source.scrollHeight - source.clientHeight);
  const targetRange = Math.max(0, target.scrollHeight - target.clientHeight);
  if (!sourceRange || !targetRange) return 0;

  const progress = Math.min(1, Math.max(0, source.scrollTop / sourceRange));
  return progress * targetRange;
}
