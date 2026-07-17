import type { OseItem } from "@domain/types";
import type {
  InventorySortKey,
  SortDir,
  InventoryVM,
  InventoryItemVM,
} from "@domain/vm-types";
import { FLAGS, readFlag } from "@domain/flags";
import { monogram } from "./monogram";

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
  // Stackable (ammo/consumables carry a real max) keeps the qty control down to the
  // last unit; a plain multi still shows. True singletons (max 0/1) stay null.
  const stackable = !!q && (q.max ?? 0) > 1;
  const hasQty = !!q && (q.value > 1 || stackable);
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

/** Equipment list for the inventory tab. Treasure (coins + gems) lives in the
 *  Treasure section, so it's filtered out here on the `system.treasure` flag. */
export function selectInventory(items: OseItem[]): InventoryVM {
  // Physical item types only — keeps spells, abilities, etc. out of inventory.
  // Treasure-flagged items (coins, gems, jewellery) surface in the Treasure
  // section instead, so exclude any item with `system.treasure === true`.
  const physical = items.filter(
    (it) => (it.type as string) in CATEGORY && !it.system?.treasure,
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

export {
  coinDenom,
  selectCoins,
  selectTreasure,
  selectWealth,
  sortWealth,
} from "./treasure";

export {
  DEFAULT_SIGNIFICANT_TREASURE,
  encBarStops,
  selectEncumbrance,
  significantTreasure,
} from "./encumbrance";
