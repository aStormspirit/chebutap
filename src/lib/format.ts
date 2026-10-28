export function formatNumber(value: number): string {
  const n = Math.floor(value);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return n.toLocaleString('ru-RU');
  return n.toLocaleString('ru-RU');
}

export function upgradeCost(base: number, factor: number, level: number): number {
  return Math.floor(base * factor ** level);
}
