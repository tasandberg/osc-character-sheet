import { InventoryViewDnd } from "@features/inventory/InventoryViewDnd";
import type { InventoryItemVM, InventoryVM, EncumbranceVM } from "@domain/vm-types";

export default { title: "Inventory / InventoryViewDnd" };

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

const encumbrance: EncumbranceVM = { enabled: true, value: 380, max: 1600, pct: 0.2375, tier: 0, status: "Unencumbered", label: "380 / 1600 cn", move: 120 };
const coins = [
  { denom: "PP", id: "pp", name: "Platinum Pieces", img: "", value: 0, gpEach: 5 },
  { denom: "GP", id: "gp", name: "Gold Pieces", img: "", value: 152, gpEach: 1 },
  { denom: "SP", id: "sp", name: "Silver Pieces", img: "", value: 8, gpEach: 0.1 },
];

const log = (label: string) => (...args: unknown[]) => console.log(label, ...args);

export const Default = () => (
  <div className="osc-sheet-app" style={{ maxWidth: 560, padding: 16 }}>
    <InventoryViewDnd
      inventory={inventory}
      encumbrance={encumbrance}
      coins={coins}
      onSetCoin={log("setCoin")}
      onEquip={log("equip")}
      onOpen={log("open")}
      onDelete={log("delete")}
      onConsume={log("consume")}
      onReorder={log("reorder")}
      onReorderEquipped={log("reorderEquipped")}
      onNest={log("nest")}
      onSend={log("send")}
    />
  </div>
);
