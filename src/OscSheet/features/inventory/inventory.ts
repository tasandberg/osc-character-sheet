import type { CharacterEncumbrance } from "@ose-foundry-core/types";
import type { OSEActor, OseItem } from "@domain/types";
import type {
  InventorySortKey,
  SortDir,
  InventoryVM,
  InventoryItemVM,
  EncumbranceVM,
  EncumbranceTier,
  CoinVM,
} from "@domain/vm-types";
import { FLAGS, readFlag } from "@domain/flags";

/** Manual order position: our own flag, falling back to Foundry's sort for un-migrated items. */
function orderOf(item: OseItem): number {
  return (
    readFlag<number>(item, FLAGS.order) ??
    (item as unknown as { sort?: number }).sort ??
    0
  );
}

/** Manual order within the equipped tray: its OWN flag, independent of the list
 *  `order` (so reordering the All-Items list never moves a tile). Items without an
 *  explicit equippedOrder fall back to 0 (ties broken by name in sortEquipped);
 *  newly-equipped items get an explicit "last" value on equip. */
function equippedOrderOf(item: OseItem): number {
  return readFlag<number>(item, FLAGS.equippedOrder) ?? 0;
}

const COIN_DENOMS = ["pp", "gp", "ep", "sp", "cp"] as const;

const COIN_METAL_DENOM: Record<string, string> = {
  gold: "gp",
  silver: "sp",
  copper: "cp",
  platinum: "pp",
  electrum: "ep",
};

/**
 * Coin denomination of a treasure item, across the naming conventions different
 * compendiums use (the system ships no coins, so these vary):
 *   - bare:       "GP" (system / Item Piles short)
 *   - bracketed:  "[01.00] gold (gp)" (classic-fantasy), "(gp)"
 *   - full name:  "Gold Pieces" / "Silver Coins" (osr-helper-style)
 * The full-name form is restricted to `<metal> Pieces|Coins` so a non-coin
 * treasure like "Gold ring" is NOT misread as gp. Returns null for non-coins.
 */
export function coinDenom(name: string): string | null {
  const bracketed = name.match(/\((pp|gp|ep|sp|cp)\)/i)?.[1];
  if (bracketed) return bracketed.toLowerCase();
  const bare = name.match(/^\s*(pp|gp|ep|sp|cp)\s*$/i)?.[1];
  if (bare) return bare.toLowerCase();
  const metal = name.match(
    /\b(gold|silver|copper|platinum|electrum)\s+(?:pieces?|coins?)\b/i,
  )?.[1];
  if (metal) return COIN_METAL_DENOM[metal.toLowerCase()];
  return null;
}

/** The coins the actor holds, in canonical order, with their current quantities. */
export function selectCoins(items: OseItem[]): CoinVM[] {
  const byDenom = new Map<string, OseItem>();
  for (const it of items) {
    if (!it.system?.treasure) continue;
    const d = coinDenom(it.name as string);
    if (d && !byDenom.has(d)) byDenom.set(d, it);
  }
  return COIN_DENOMS.flatMap((d) => {
    const it = byDenom.get(d);
    if (!it) return [];
    const cost = (it.system as { cost?: number }).cost ?? 0;
    return [
      {
        denom: d.toUpperCase(),
        id: it._id as string,
        name: (it.name as string) ?? d.toUpperCase(),
        img: (it.img as string) ?? "",
        value: it.system.quantity?.value ?? 0,
        gpEach: cost > 0 ? cost : (GP_PER_COIN[d] ?? 0),
      },
    ];
  });
}

// Standard OSE gp value per coin — fallback when an item's system.cost is unset.
const GP_PER_COIN: Record<string, number> = {
  pp: 5,
  gp: 1,
  ep: 0.5,
  sp: 0.1,
  cp: 0.01,
};

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

const CATEGORY: Record<string, { label: string; rank: number }> = {
  weapon: { label: "Weapon", rank: 0 },
  armor: { label: "Armour", rank: 1 },
  item: { label: "Gear", rank: 2 },
  treasure: { label: "Gear", rank: 2 },
  container: { label: "Container", rank: 3 },
};

function categoryFor(type: string): { label: string; rank: number } {
  return CATEGORY[type] ?? { label: "Gear", rank: 2 };
}

// ---------------------------------------------------------------------------
// Item → VM helpers
// ---------------------------------------------------------------------------

/** 2-letter card monogram: first letters of the first two words, else first two chars. */
function monogram(name: string): string {
  const words = name.match(/[A-Za-z]+/g) ?? [];
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

type RawTag = { label?: string; value?: string; icon?: string };

/** Tags from system.tags, excluding Currency, deduped by label. */
function itemTags(item: OseItem): { label: string; icon: string }[] {
  const raw: RawTag[] = (item.system.tags as RawTag[] | undefined) ?? [];
  const seen = new Set<string>();
  const out: { label: string; icon: string }[] = [];
  for (const t of raw) {
    const label = t.label ?? t.value ?? "";
    if (!label || label === "Currency" || seen.has(label)) continue;
    seen.add(label);
    out.push({ label, icon: t.icon ?? "" });
  }
  return out;
}

function isCurrency(item: OseItem): boolean {
  return (item.system.tags ?? []).some(
    (t: { value: string }) => t.value === "Currency",
  );
}

/** World ascending-AC setting (descending is the OSE default). Safe in non-Foundry tests. */
function ascendingAC(): boolean {
  try {
    // fvtt-types doesn't know OSE's settings namespace; read it loosely.
    const settings = game.settings as { get(ns: string, key: string): unknown };
    return !!settings.get(game.system.id, "ascendingAC");
  } catch {
    return false;
  }
}

/** Armour class for an armour item: AAC (ascending) or AC (descending) per setting. */
function armorClassOf(item: OseItem): { label: string; value: number } | null {
  if (item.type !== "armor") return null;
  const s = item.system as {
    ac?: { value?: number };
    aac?: { value?: number };
  };
  return ascendingAC()
    ? { label: "AAC", value: s.aac?.value ?? 0 }
    : { label: "AC", value: s.ac?.value ?? 0 };
}

function toVM(
  item: OseItem,
  children: InventoryItemVM[] = [],
): InventoryItemVM {
  const s = item.system;
  const q = s.quantity;
  const hasQty = !!q && (q.value > 1 || (q.max ?? 0) > 1);
  const cat = categoryFor(item.type as string);
  const dmg =
    item.type === "weapon" ? ((s as { damage?: string }).damage ?? "") : "";
  return {
    id: item._id as string,
    name: item.name as string,
    img: item.img,
    category: cat.label,
    categoryRank: cat.rank,
    damage: dmg,
    tags: itemTags(item),
    monogram: monogram(item.name as string),
    weight: s.cumulativeWeight ?? s.weight ?? 0,
    cost: (s as { cost?: number }).cost ?? 0,
    armorClass: armorClassOf(item),
    sort: orderOf(item),
    equippedSort: equippedOrderOf(item),
    equipped: "equipped" in s ? !!s.equipped : null,
    quantity: hasQty ? { value: q.value, max: q.max || q.value } : null,
    isContainer: item.type === "container",
    children,
  };
}

// ---------------------------------------------------------------------------
// selectInventory
// ---------------------------------------------------------------------------

/** Equipment list for the inventory tab. Coins stay in the coin editor. */
export function selectInventory(items: OseItem[]): InventoryVM {
  // Physical item types only — keeps spells, abilities, etc. out of inventory. Also exclude coins.
  const physical = items.filter(
    (it) =>
      (it.type as string) in CATEGORY &&
      !isCurrency(it) &&
      !coinDenom(it.name as string),
  );

  // Index by id for O(1) child lookups
  const byId = new Map<string, OseItem>(
    physical.map((it) => [it._id as string, it]),
  );

  // Partition: children (have a containerId pointing to a known container) vs top-level
  const childrenByContainer = new Map<string, OseItem[]>();
  const topLevel: OseItem[] = [];

  for (const it of physical) {
    const cid: string | undefined = (it.system as { containerId?: string })
      .containerId;
    if (cid && byId.has(cid)) {
      const bucket = childrenByContainer.get(cid) ?? [];
      bucket.push(it);
      childrenByContainer.set(cid, bucket);
    } else {
      topLevel.push(it);
    }
  }

  // Build VM nodes, sorting children by sort index
  function buildVM(item: OseItem): InventoryItemVM {
    const rawChildren = childrenByContainer.get(item._id as string) ?? [];
    rawChildren.sort((a, b) => orderOf(a) - orderOf(b));
    return toVM(item, rawChildren.map(buildVM));
  }

  const vmItems = topLevel.map(buildVM);

  // count = all items in the tree
  function countAll(list: InventoryItemVM[]): number {
    return list.reduce((n, it) => n + 1 + countAll(it.children), 0);
  }

  // Equipped subset for the tray — pulled from the same tree (items still lists
  // them as rows). Flatten so an equipped nested item is included too, then order
  // by the tray's own `equippedOrder` flag (independent of the list `order`).
  function flatten(list: InventoryItemVM[]): InventoryItemVM[] {
    return list.flatMap((it) => [it, ...flatten(it.children)]);
  }
  const equipped = sortEquipped(
    flatten(vmItems).filter((it) => it.equipped === true),
  );

  // Legacy groups for grid view compatibility
  const GROUPS = [
    { key: "weapons", label: "Weapons", types: ["weapon"] },
    { key: "armour", label: "Armour & Wards", types: ["armor"] },
    { key: "gear", label: "Gear", types: ["item", "treasure"] },
  ];
  const groups = GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    items: vmItems.filter(
      (it) =>
        g.types.includes(it.category.toLowerCase()) ||
        (g.key === "gear" && it.categoryRank === 2),
    ),
  })).filter((g) => g.items.length > 0);

  return { items: vmItems, equipped, count: countAll(vmItems), groups };
}

// ---------------------------------------------------------------------------
// sortInventory
// ---------------------------------------------------------------------------

/** Natural direction each column sorts in when first selected. */
export const SORT_DEFAULT_DIR: Record<InventorySortKey, SortDir> = {
  manual: "asc", // by our order flag — free drag-reordering
  category: "asc", // rank 0→3
  name: "asc", // A→Z
  weight: "desc", // heaviest first
};

/** Pure sort — by `key`/`dir`. Returns a new array, recurses into children. */
export function sortInventory(
  list: InventoryItemVM[],
  key: InventorySortKey,
  dir: SortDir = SORT_DEFAULT_DIR[key],
): InventoryItemVM[] {
  const f = dir === "asc" ? 1 : -1;
  const sorted = [...list].sort((a, b) => {
    switch (key) {
      case "manual":
        if (a.sort !== b.sort) return (a.sort - b.sort) * f;
        return a.name.localeCompare(b.name);
      case "category":
        if (a.categoryRank !== b.categoryRank)
          return (a.categoryRank - b.categoryRank) * f;
        if (a.sort !== b.sort) return a.sort - b.sort;
        return a.name.localeCompare(b.name);
      case "name":
        return a.name.localeCompare(b.name) * f;
      case "weight":
        return (a.weight - b.weight) * f;
    }
  });
  return sorted.map((it) =>
    it.children.length > 0
      ? { ...it, children: sortInventory(it.children, key, dir) }
      : it,
  );
}

/** Order the equipped-tray subset by each item's `equippedSort` (ties broken by name). */
export function sortEquipped(items: InventoryItemVM[]): InventoryItemVM[] {
  return [...items].sort((a, b) =>
    a.equippedSort !== b.equippedSort
      ? a.equippedSort - b.equippedSort
      : a.name.localeCompare(b.name),
  );
}

// ---------------------------------------------------------------------------
// Encumbrance
// ---------------------------------------------------------------------------

// Status by tier — indexed by EncumbranceTier. OSE has no localized labels for
// weight tiers, so these are ours; tier itself comes from the system's breakpoints.
const TIER_STATUS = [
  "Unencumbered",
  "Lightly encumbered",
  "Heavily encumbered",
  "Severely encumbered",
  "Overloaded",
] as const;

/** OSE's default significant-treasure threshold, in cn (basic encumbrance). */
export const DEFAULT_SIGNIFICANT_TREASURE = 800;

/**
 * World significant-treasure setting (basic encumbrance), in cn. OSE registers it as a
 * NUMBER — coercing it to a boolean fed `true` into the encumbrance ctor, where
 * `options.significantTreasure || 800` kept the `true` and made every threshold check
 * `value >= true`, i.e. tripping at 1cn of treasure. Safe in non-Foundry tests.
 */
export function significantTreasure(): number {
  try {
    const settings = game.settings as { get(ns: string, key: string): unknown };
    const v = Number(settings.get(game.system.id, "significantTreasure"));
    return Number.isFinite(v) && v > 0 ? v : DEFAULT_SIGNIFICANT_TREASURE;
  } catch {
    return DEFAULT_SIGNIFICANT_TREASURE;
  }
}

/**
 * Constructor shape of OSE's active encumbrance class (variant per world setting).
 * The `ose` types package exports the CharacterEncumbrance *instance* interface but
 * not the variant classes (nor a matching ctor sig), so the ctor is spelled here.
 */
type EncumbranceCtor = new (
  max: number,
  items: OseItem[],
  options: { significantTreasure: number; scores: unknown },
  strMod: number,
) => CharacterEncumbrance;

export function selectEncumbrance(
  actor: OSEActor,
  items?: OseItem[],
): EncumbranceVM {
  const live = actor.system.encumbrance;
  // Optimistically recompute from the overlaid items via OSE's OWN encumbrance class,
  // mirroring the system's construction, so equip/nest/consume/qty changes reflect
  // instantly instead of waiting for the actor to re-prep. `max` (STR-derived cap) is
  // item-independent so it's taken off the live instance. No items ⇒ live instance (tests).
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
  // Tier = highest breakpoint reached (over-limit tops out at 4); use the system's
  // variant-aware flags, not our own % buckets.
  const breakpoints = [
    e.atFirstBreakpoint,
    e.atSecondBreakpoint,
    e.atThirdBreakpoint,
    e.encumbered,
  ];
  const tier = (breakpoints.lastIndexOf(true) + 1) as EncumbranceTier;
  // Basic encumbrance is categorical (armor + treasure threshold) — value/max in cn
  // has no bearing on the tier, so a weight bar/readout would contradict the status.
  // Drive the bar off the tier (basic tops out at the 3rd breakpoint) and drop the
  // misleading cn load. Weight/slot variants keep their real value/max load + fill.
  const isBasic = e.variant === "basic";
  const pct = isBasic
    ? Math.min(1, tier / BASIC_TIER_CAP)
    : e.max > 0
      ? Math.min(1, e.value / e.max)
      : 0;
  const unit = e.variant === "itembased" ? "items" : "cn";
  return {
    enabled: e.enabled,
    value: e.value,
    max: e.max,
    pct,
    tier,
    status: TIER_STATUS[tier],
    label: isBasic ? "" : `${e.value} / ${e.max} ${unit}`,
    moveBands: {
      encounter: movement?.encounter ?? 0,
      explore: movement?.base ?? 0,
      travel: movement?.overland ?? 0,
    },
    // The bar's colour must change exactly where the tier does. For weight/slot
    // variants the axis IS weight, so the stops are the system's own breakpoints
    // (`steps`, already variant- and mode-aware). Basic's bar has no weight axis
    // (see above) — there are no thresholds to plot, so it gets no stops and paints
    // solid in the current tier's colour instead of implying fictitious ones.
    bands: isBasic ? [] : (e.steps ?? []),
  };
}

/** Basic tops out at the 3rd breakpoint — its synthetic bar fills tier/3. */
const BASIC_TIER_CAP = 3;

/** Half-width (in %) of the colour fade centred on each tier threshold. */
const ENC_FADE_HALF = 4;

/**
 * CSS colour-stop list for the encumbrance bar. Each tier holds its pure `--enc-N`
 * colour across its band, then fades into the next over a narrow window CENTRED on
 * the real threshold — so at a boundary % the colour is exactly 50/50 between the two
 * tiers (the tier change still reads at the right spot), but the segments blend
 * smoothly instead of butting hard edges. No thresholds ⇒ a solid bar in the current
 * tier's colour. Colours are the shared `--enc-N` tokens — one tier, one colour.
 */
export function encBarStops({ bands, tier }: Pick<EncumbranceVM, "bands" | "tier">): string {
  if (bands.length === 0) return `var(--enc-${tier}) 0 100%`;
  const stops = ["var(--enc-0) 0%"];
  bands.forEach((t, i) => {
    const from = Math.max(0, t - ENC_FADE_HALF);
    const to = Math.min(100, t + ENC_FADE_HALF);
    // hold this tier's colour up to the fade's start, then ramp to the next by its end
    stops.push(`var(--enc-${Math.min(i, 4)}) ${from}%`);
    stops.push(`var(--enc-${Math.min(i + 1, 4)}) ${to}%`);
  });
  stops.push(`var(--enc-${Math.min(bands.length, 4)}) 100%`);
  return stops.join(", ");
}
