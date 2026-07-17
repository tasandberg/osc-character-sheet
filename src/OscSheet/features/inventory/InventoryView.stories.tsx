import { InventoryView } from "@features/inventory";
import { OscSheetContext } from "@app/context";
import type { OscSheetContextValue } from "@domain/types";
import type { InventoryItemVM, InventoryVM, EncumbranceVM, WealthRow } from "@domain/vm-types";

export default { title: "Inventory / InventoryView" };

const item = (o: Partial<InventoryItemVM> & { id: string; name: string }): InventoryItemVM => ({
  img: "",
  category: "Gear",
  categoryRank: 2,
  damage: "",
  tags: [],
  monogram: o.name.slice(0, 2).toUpperCase(),
  weight: 0,
  cost: 0,
  armorClass: null,
  sort: 0,
  equippedSort: 0,
  equipped: null,
  quantity: null,
  isContainer: false,
  children: [],
  ...o,
});

const inventory: InventoryVM = {
  equipped: [
    item({ id: "e1", name: "Long bow", category: "Weapon", categoryRank: 0, damage: "1d6", equipped: true, weight: 30, tags: [{ label: "Missile", icon: "" }] }),
    item({ id: "e2", name: "Plate Mail", category: "Armour", categoryRank: 1, equipped: true, weight: 40 }),
  ],
  items: [
    item({ id: "1", name: "Dagger", category: "Weapon", categoryRank: 0, damage: "1d4", equipped: false, weight: 20, sort: 100, tags: [{ label: "Melee", icon: "" }, { label: "Thrown", icon: "" }] }),
    item({ id: "2", name: "Shield", category: "Armour", categoryRank: 1, equipped: false, weight: 10, sort: 200 }),
    item({ id: "3", name: "Arrow quiver", equipped: null, weight: 5, sort: 300, quantity: { value: 20, max: 20 } }),
    item({
      id: "c1", name: "Backpack", category: "Container", categoryRank: 3, equipped: false, weight: 80, sort: 400, isContainer: true,
      children: [
        item({ id: "4", name: "Rations (7 days)", weight: 80, sort: 100, quantity: { value: 7, max: 7 } }),
        item({ id: "5", name: "Torches", weight: 0, sort: 200, quantity: { value: 6, max: 6 } }),
      ],
    }),
    item({ id: "6", name: "Rope, 50'", weight: 50, sort: 500 }),
  ],
  count: 7,
  groups: [],
};

const encumbrance: EncumbranceVM = { enabled: true, value: 380, max: 1600, pct: 0.2375, tier: 0, status: "Unencumbered", label: "380 / 1600 cn", moveBands: { encounter: 40, explore: 120, travel: 24 }, bands: [25, 37.5, 50] };
const coin = (denom: string, qty: number, gpEach: number): WealthRow => ({
  kind: "coin", denom, id: denom.toLowerCase(), name: `${denom} coins`, img: "",
  monogram: denom, gpEach, qty, weight: qty, value: qty * gpEach,
});
const valuable = (id: string, name: string, monogram: string, qty: number, weight: number, cost: number): WealthRow => ({
  kind: "treasure", id, name, img: "", monogram, qty, weight, value: qty * cost,
});

// Coins (canonical order) then read-only valuables — the merged Treasure table.
const wealth: WealthRow[] = [
  coin("PP", 0, 5),
  coin("GP", 152, 1),
  coin("SP", 8, 0.1),
  valuable("t1", "Diamond", "DI", 3, 3, 500),
  valuable("t2", "Gold necklace", "GN", 1, 10, 800),
];

const log = (label: string) => (...args: unknown[]) => console.log(label, ...args);

// InventoryView / WealthSection read `canEdit` + `items` off the sheet context —
// provide an owner stub so the story renders.
const ctx = { canEdit: true, items: [] } as unknown as OscSheetContextValue;

const View = (over: Partial<Parameters<typeof InventoryView>[0]> = {}) => (
  <OscSheetContext.Provider value={ctx}>
    <div className="osc-sheet-app" style={{ maxWidth: 560, padding: 16 }}>
    <InventoryView
      inventory={inventory}
      encumbrance={encumbrance}
      wealth={wealth}
      onSetCoin={log("setCoin")}
      onCreate={log("create")}
      onEquip={log("equip")}
      onOpen={log("open")}
      onDelete={log("delete")}
      onConsume={log("consume")}
      onSetQty={log("setQty")}
      onReorder={log("reorder")}
      onReorderEquipped={log("reorderEquipped")}
      onNest={log("nest")}
      onSend={log("send")}
      {...over}
    />
    </div>
  </OscSheetContext.Provider>
);

export const Default = () => View();

// Large coin sum — the value column must render the bare number (units in the
// header) without wrapping "gp" to a second line.
export const BigTotal = () =>
  View({
    wealth: [
      coin("PP", 480, 5),
      coin("GP", 2452, 1),
      coin("SP", 8, 0.1),
      valuable("t1", "Diamond", "DI", 3, 3, 500),
      valuable("t2", "Gold necklace", "GN", 1, 10, 800),
    ],
  });

// Valuables but no coins — the column headers still render so the gem rows get
// labelled Item/Qty/Weight/Value columns.
export const GemsNoCoins = () =>
  View({
    wealth: [
      valuable("t1", "Diamond", "DI", 3, 3, 500),
      valuable("t2", "Gold necklace", "GN", 1, 10, 800),
    ],
  });
