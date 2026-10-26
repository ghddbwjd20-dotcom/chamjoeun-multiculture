export type Range = [number, number];
export function mergeRanges(ranges: Range[], duration: number): Range[] {
  const sorted = ranges
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .map(([a, b]) => [Math.max(0, a), Math.min(duration, b)] as Range)
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0]);
  const result: Range[] = [];
  for (const range of sorted) {
    const last = result.at(-1);
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else result.push([...range]);
  }
  return result;
}
export function watchedSeconds(ranges: Range[]) {
  return ranges.reduce((sum, [a, b]) => sum + b - a, 0);
}
export function acceptInterval(
  previous: number,
  position: number,
  elapsed: number,
  playing: boolean,
  duration: number,
): Range | null {
  if (
    !playing ||
    ![previous, position, elapsed, duration].every(Number.isFinite) ||
    elapsed <= 0 ||
    elapsed > 30 ||
    position < 0 ||
    position > duration
  )
    return null;
  const delta = position - previous;
  if (delta <= 0 || delta > elapsed * 2 + 1) return null;
  return [Math.max(0, previous), Math.min(duration, position)];
}
