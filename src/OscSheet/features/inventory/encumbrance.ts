import type { CharacterEncumbrance } from "@ose-foundry-core/types";
import type { OSEActor, OseItem } from "@domain/types";
import type { EncumbranceVM, EncumbranceTier } from "@domain/vm-types";

const TIER_STATUS = [
  "Unencumbered",
  "Lightly encumbered",
  "Heavily encumbered",
  "Severely encumbered",
  "Overloaded",
] as const;

export const DEFAULT_SIGNIFICANT_TREASURE = 800;

export function significantTreasure(): number {
  try {
    const settings = game.settings as { get(ns: string, key: string): unknown };
    const v = Number(settings.get(game.system.id, "significantTreasure"));
    return Number.isFinite(v) && v > 0 ? v : DEFAULT_SIGNIFICANT_TREASURE;
  } catch {
    return DEFAULT_SIGNIFICANT_TREASURE;
  }
}

type EncumbranceCtor = new (
  max: number,
  items: OseItem[],
  options: { significantTreasure: number; scores: unknown },
  strMod: number,
) => CharacterEncumbrance;

export function selectEncumbrance(actor: OSEActor, items?: OseItem[]): EncumbranceVM {
  const live = actor.system.encumbrance;
  if (!live) {
    const movement = actor.system.movement;
    return {
      enabled: false,
      value: 0,
      max: 0,
      pct: 0,
      tier: 0,
      status: TIER_STATUS[0],
      label: "",
      moveBands: {
        encounter: Math.floor(movement?.encounter ?? 0),
        explore: Math.floor(movement?.base ?? 0),
        travel: Math.floor(movement?.overland ?? 0),
      },
      bands: [],
    };
  }
  const e =
    items === undefined
      ? live
      : new (live.constructor as unknown as EncumbranceCtor)(
          live.max,
          items,
          {
            significantTreasure: significantTreasure(),
            scores: actor.system.scores,
          },
          actor.system.scores?.str?.mod ?? 0,
        );
  const movement = actor.system.movement;
  const sigTreasure = significantTreasure();
  const immobile = e.variant === "basic" && e.value >= e.max;
  const pct = e.max > 0 ? Math.min(1, e.value / e.max) : 0;
  const steps = immobile ? [] : (e.steps ?? []);
  const bands =
    e.variant === "basic" && steps.length === 1
      ? [steps[0], steps[0] + (100 - steps[0]) / 2, 90]
      : steps;
  const overloaded = immobile || e.encumbered;
  const tier = fillTier(pct, bands, overloaded);
  const unit = e.variant === "itembased" ? "items" : "cn";
  return {
    enabled: e.enabled,
    value: e.value,
    max: e.max,
    pct,
    tier,
    status: TIER_STATUS[tier],
    label: `${e.value} / ${e.max} ${unit}`,
    armorTier: basicArmorTier(e, sigTreasure),
    moveBands: {
      encounter: Math.floor(movement?.encounter ?? 0),
      explore: Math.floor(movement?.base ?? 0),
      travel: Math.floor(movement?.overland ?? 0),
    },
    bands,
    barTier: tier,
  };
}

function fillTier(pct: number, bands: number[], overloaded: boolean): EncumbranceTier {
  if (overloaded) return 4;
  const p = pct * 100;
  const crossed = bands.reduce((n, b) => (p >= b ? n + 1 : n), 0);
  return Math.min(crossed, 4) as EncumbranceTier;
}

function basicArmorTier(
  e: CharacterEncumbrance,
  sigTreasure: number,
): "unarmored" | "light" | "heavy" | undefined {
  if (e.variant !== "basic") return undefined;
  const heavy = e.atThirdBreakpoint || (e.atSecondBreakpoint && !e.atFirstBreakpoint);
  if (heavy) return "heavy";
  const overTreasure = e.value >= sigTreasure;
  const light = e.atSecondBreakpoint || (e.atFirstBreakpoint && !overTreasure);
  return light ? "light" : "unarmored";
}

const ENC_FADE_HALF = 4;

export function encBarStops({
  bands,
  tier,
  barTier,
}: Pick<EncumbranceVM, "bands" | "tier" | "barTier">): string {
  if (bands.length === 0) return `var(--enc-${barTier ?? tier}) 0 100%`;
  const stops = ["var(--enc-0) 0%"];
  bands.forEach((t, i) => {
    const from = Math.max(0, t - ENC_FADE_HALF);
    const to = Math.min(100, t + ENC_FADE_HALF);
    stops.push(`var(--enc-${Math.min(i, 4)}) ${from}%`);
    stops.push(`var(--enc-${Math.min(i + 1, 4)}) ${to}%`);
  });
  stops.push(`var(--enc-${Math.min(bands.length, 4)}) 100%`);
  return stops.join(", ");
}
