import type { OseItem } from "@domain/types";
import type {
  CoinVM,
  TreasureVM,
  WealthRow,
  WealthSortKey,
  SortDir,
} from "@domain/vm-types";
import { monogram } from "./monogram";

const COIN_DENOMS = ["pp", "gp", "ep", "sp", "cp"] as const;

const COIN_METAL_DENOM: Record<string, string> = {
  gold: "gp",
  silver: "sp",
  copper: "cp",
  platinum: "pp",
  electrum: "ep",
};

// Standard OSE gp value per coin — fallback when an item's system.cost is unset.
const GP_PER_COIN: Record<string, number> = {
  pp: 5,
  gp: 1,
  ep: 0.5,
  sp: 0.1,
  cp: 0.01,
};

function isCurrency(item: OseItem): boolean {
  return (item.system.tags ?? []).some(
    (t: { value: string }) => t.value === "Currency",
  );
}

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

/**
 * Non-coin treasure (gems, jewellery, …) for the Treasure section — every item
 * with `system.treasure === true` that isn't a coin. Pulled from the flat item
 * list regardless of containment, so treasure nested in a container surfaces here
 * (and, since selectInventory filters the same flag, ONLY here — no double-render).
 */
export function selectTreasure(items: OseItem[]): TreasureVM[] {
  return items
    .filter(
      (it) =>
        it.system?.treasure &&
        !coinDenom(it.name as string) &&
        !isCurrency(it),
    )
    .map((it) => {
      const s = it.system as {
        cost?: number;
        quantity?: { value?: number };
        cumulativeWeight?: number;
        weight?: number;
      };
      // Singletons null `quantity` (see toVM) — a section total must fall back to 1.
      const qty = s.quantity?.value ?? 1;
      const cost = s.cost ?? 0;
      return {
        id: it._id as string,
        name: it.name as string,
        img: (it.img as string) ?? "",
        monogram: monogram(it.name as string),
        qty,
        weight: s.cumulativeWeight ?? s.weight ?? 0,
        cost,
        value: qty * cost,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The Treasure table's unified row list: coins first (canonical pp→cp order),
 * then non-coin valuables (name order). One array, one row shape (`WealthRow`),
 * so a single row component renders both — branching on `kind` only for the
 * interactive bits (coins edit their qty + drag; valuables are read-only). The
 * live coin qty/weight/value are recomputed in the component as edits land, so a
 * coin row's numbers here are its committed baseline.
 */
export function selectWealth(items: OseItem[]): WealthRow[] {
  const coins: WealthRow[] = selectCoins(items).map((c) => ({
    kind: "coin",
    id: c.id,
    name: c.name,
    img: c.img,
    monogram: c.denom,
    denom: c.denom,
    gpEach: c.gpEach,
    qty: c.value,
    weight: c.value, // coins are 1 cn each
    value: c.value * c.gpEach,
  }));
  const valuables: WealthRow[] = selectTreasure(items).map((t) => ({
    kind: "treasure",
    id: t.id,
    name: t.name,
    img: t.img,
    monogram: t.monogram,
    qty: t.qty,
    weight: t.weight,
    value: t.value,
  }));
  return [...coins, ...valuables];
}

/**
 * Sort the WHOLE Treasure list — coins and valuables together, interleaved by the
 * chosen field (not two groups). `manual` keeps the caller's order (selectWealth's
 * canonical order, or a dragged baseline). name = string compare; qty/weight/value
 * = numeric on the row's committed figures. Returns a new array; `manual` is a
 * no-op passthrough.
 */
export function sortWealth(
  rows: WealthRow[],
  key: WealthSortKey,
  dir: SortDir,
): WealthRow[] {
  if (key === "manual") return rows;
  const f = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const cmp =
      key === "item"
        ? a.name.localeCompare(b.name)
        : key === "qty"
          ? a.qty - b.qty
          : key === "weight"
            ? a.weight - b.weight
            : a.value - b.value;
    return cmp * f;
  });
}
