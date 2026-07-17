import type { EncumbranceTier, MoveBands } from "@domain/vm-types";

/** Format a modifier for display: +0, +2, -3. */
export function formatMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

/** Tier → colour class (`--enc-0…4`, defined in styles.scss). One tier, one colour, sheet-wide. */
export function encTierClass(tier: EncumbranceTier): string {
  return `enc-t${tier}`;
}

/** Basic-mode armor weight class → display label. */
export function armorTierLabel(t: "unarmored" | "light" | "heavy"): string {
  return { unarmored: "Unarmored", light: "Light", heavy: "Heavy" }[t];
}

/** Screen-reader sentence for a rates line — the units the glyphs imply, spelled out. */
export function moveRatesLabel(b: MoveBands): string {
  return `${b.encounter} feet per round, ${b.explore} feet per turn, ${b.travel} miles per day`;
}
