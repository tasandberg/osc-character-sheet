/** Format a modifier for display: +0, +2, -3. */
export function formatMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}
