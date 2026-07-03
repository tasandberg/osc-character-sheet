// Build-time feature gates for controls not yet ready for release.
// Flip a flag to `true` to re-surface its UI — the underlying components stay
// wired, so re-enabling is a one-line change. Tracked in OLD-19.

export const FEATURES = {
  /** Topbar "Level Up" — no advancement flow yet (GH #22). */
  levelUp: false,
  /** Topbar "Rest" — no character-level HP/HD recovery yet. */
  rest: false,
  /** Inventory "Send Item" to another actor (GH #16). */
  sendItem: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;
