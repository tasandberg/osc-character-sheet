// Build-time feature gates for controls not yet ready for release.
// Flip a flag to `true` to re-surface its UI — the underlying components stay
// wired, so re-enabling is a one-line change. Tracked in OLD-19.

export const FEATURES = {
  /** Inventory "Send Item" to another actor (GH #16). */
  sendItem: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;
