// utils/formatters.ts
export function formatWeight(grams: number, decimals = 2): string {
  return grams.toFixed(decimals);
}

export function formatMg(mg: number): string {
  return mg.toFixed(2);
}

export function formatPercentage(value: number, decimals = 1): string {
  return (value * 100).toFixed(decimals);
}