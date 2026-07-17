/** Coin/gp number: integers get thousands separators, fractions trim to ≤2 dp. */
export function fmtCoin(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString("en-US") : (+n.toFixed(2)).toString();
}
