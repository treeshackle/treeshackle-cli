export function pluralize(unit: string, count: number) {
  // Simple pluralization
  return unit + (count === 1 ? "" : "s");
}
