export function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100
}
