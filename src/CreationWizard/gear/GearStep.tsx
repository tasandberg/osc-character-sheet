import { useId, useRef, useState } from "react";
import { MoreBelow } from "../MoreBelow";
import type { CreationRules } from "../rules";
import { useCompendiumDetail } from "../useCompendiumDetail";
import {
  affordReason,
  goldLeft,
  itemCount,
  quantityOf,
  setQuantity,
  STARTING_GOLD_FORMULA,
  type GearDraft,
} from "./gearDraft";
import type { GearCategory, GearItem } from "./gearTypes";

type Tab = "all" | GearCategory;

const TABS: { id: Tab; label: string; column: string }[] = [
  { id: "all", label: "All", column: "Item" },
  { id: "weapons", label: "Weapons", column: "Weapon" },
  { id: "armour", label: "Armour", column: "Armour" },
  { id: "ammunition", label: "Ammunition", column: "Ammunition" },
  { id: "gear", label: "Gear", column: "Gear" },
];

type Change = (update: (draft: GearDraft) => GearDraft) => void;

type Props = {
  draft: GearDraft;
  rules: CreationRules;
  onChange: Change;
};

const weightText = (weight: number) => (weight ? `${weight} cn` : "");

const ItemImage = ({ img }: { img: string }) =>
  img ? (
    <img className="osc-creation-item-img" src={img} alt="" />
  ) : (
    <span className="osc-creation-item-img" />
  );

function QuantityStepper({
  item,
  quantity,
  blocked,
  onQuantity,
}: {
  item: GearItem;
  quantity: number;
  blocked?: string;
  onQuantity: (quantity: number) => void;
}) {
  const reasonId = useId();
  return (
    <span className="vm-stepper" role="group" aria-label={item.name}>
      <button
        type="button"
        className="vm-stepper-btn"
        aria-label={`One fewer ${item.name}`}
        onClick={() => onQuantity(quantity - 1)}
      >
        <i className="fa-solid fa-minus u-fs-3xs" aria-hidden="true" />
      </button>
      <output className="vm-stepper-value" aria-live="polite">
        {quantity}
      </output>
      <button
        type="button"
        className="vm-stepper-btn"
        aria-label={`One more ${item.name}`}
        aria-disabled={blocked ? true : undefined}
        aria-describedby={blocked ? reasonId : undefined}
        onClick={() => !blocked && onQuantity(quantity + 1)}
      >
        <i className="fa-solid fa-plus u-fs-3xs" aria-hidden="true" />
      </button>
      {blocked && (
        <span id={reasonId} className="tw:sr-only">
          {blocked}
        </span>
      )}
    </span>
  );
}

function ShopRow({
  item,
  draft,
  onChange,
  openSheet,
}: {
  item: GearItem;
  draft: GearDraft;
  onChange: Change;
  openSheet: (uuid: string) => void;
}) {
  const reasonId = useId();
  const quantity = quantityOf(draft, item.uuid);
  const blocked = affordReason(draft, item);
  const onQuantity = (next: number) =>
    onChange((d) => setQuantity(d, item, next));
  return (
    <tr aria-selected={quantity > 0 || undefined}>
      <td>
        <span className="u-flex u-items-center u-gap-3">
          <ItemImage img={item.img} />
          <span>
            <button
              type="button"
              className="osc-creation-shop-name vm-dotted-hover tw:block"
              onClick={() => openSheet(item.uuid)}
            >
              {item.name}
            </button>
            {item.detail && (
              <span className="tw:block u-fs-2xs u-text-dim">
                {item.detail}
              </span>
            )}
          </span>
        </span>
      </td>
      <td className="vm-table-num">{item.cost} gp</td>
      <td className="vm-table-num">{weightText(item.weight)}</td>
      <td className="osc-creation-shop-quantity">
        {quantity > 0 ? (
          <QuantityStepper
            item={item}
            quantity={quantity}
            blocked={blocked}
            onQuantity={onQuantity}
          />
        ) : (
          <>
            <button
              type="button"
              className="vm-btn vm-btn-secondary vm-btn-sm"
              aria-label={`Add ${item.name}`}
              aria-disabled={blocked ? true : undefined}
              aria-describedby={blocked ? reasonId : undefined}
              onClick={() => !blocked && onQuantity(1)}
            >
              Add
            </button>
            {blocked && (
              <span id={reasonId} className="tw:sr-only">
                {blocked}
              </span>
            )}
            <span
              className="vm-stepper osc-creation-shop-sizer"
              aria-hidden="true"
            >
              <span className="vm-stepper-btn" />
              <span className="vm-stepper-value" />
              <span className="vm-stepper-btn" />
            </span>
          </>
        )}
      </td>
    </tr>
  );
}

function Shop({
  catalog,
  draft,
  onChange,
  openSheet,
}: {
  catalog: GearItem[];
  draft: GearDraft;
  onChange: Change;
  openSheet: (uuid: string) => void;
}) {
  const paneRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("weapons");
  const [query, setQuery] = useState("");
  const inTab = (id: Tab) =>
    id === "all" ? catalog : catalog.filter((item) => item.category === id);
  const needle = query.trim().toLowerCase();
  const shown = inTab(tab).filter((item) =>
    item.name.toLowerCase().includes(needle),
  );
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div
      ref={paneRef}
      className="osc-creation-pane osc-creation-shop-pane u-gap-3"
    >
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">Equip Your Character</h2>
      </div>
      <div className="u-row u-wrap u-gap-4">
        <div className="vm-tabs" role="tablist" aria-label="Shop category">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className="vm-tab"
              aria-selected={t.id === tab}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="vm-tab-count">{inTab(t.id).length}</span>
            </button>
          ))}
        </div>
        <label className="vm-search-wrap osc-creation-shop-search">
          <i
            className="vm-search-icon fa-solid fa-magnifying-glass"
            aria-hidden="true"
          />
          <input
            className="vm-search"
            type="search"
            aria-label="Search items"
            placeholder="Search items"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div role="tabpanel" aria-label={current.label}>
        <table className="vm-table vm-table-dense osc-creation-shop-table">
          <thead>
            <tr>
              <th>{current.column}</th>
              <th className="vm-table-num">Cost</th>
              <th className="vm-table-num">Weight</th>
              <th>In pack</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => (
              <ShopRow
                key={item.uuid}
                item={item}
                draft={draft}
                onChange={onChange}
                openSheet={openSheet}
              />
            ))}
          </tbody>
        </table>
        {shown.length === 0 && needle && (
          <p className="vm-help u-py-3">Nothing matches “{query.trim()}”.</p>
        )}
      </div>
      <MoreBelow scroller={paneRef} contentKey={`${tab}:${needle}`} />
    </div>
  );
}

function GoldRoll({ draft, rules, onChange }: Props) {
  const [rolling, setRolling] = useState(false);
  const roll = async () => {
    if (rolling) return;
    setRolling(true);
    try {
      const gold = await rules.rollStartingGold(
        STARTING_GOLD_FORMULA,
        "Starting gold (3d6 × 10)",
      );
      onChange((d) => ({ ...d, gold }));
    } finally {
      setRolling(false);
    }
  };
  return (
    <dl className="osc-creation-gold-roll u-px-3 u-py-2">
      {draft.gold ? (
        <>
          <dt className="vm-key">Gold left</dt>
          <dd className="vm-mono">
            {goldLeft(draft)}{" "}
            <span className="u-text-dim">of {draft.gold.total} gp</span>
          </dd>
        </>
      ) : (
        <>
          <dt className="vm-key">Starting gold</dt>
          <dd>
            <button
              type="button"
              className="vm-btn vm-btn-sm vm-btn-primary osc-creation-nowrap"
              aria-disabled={rolling || undefined}
              onClick={roll}
            >
              Roll starting gold
            </button>
          </dd>
        </>
      )}
    </dl>
  );
}

function Pack(props: Props) {
  const { draft } = props;
  const asideRef = useRef<HTMLElement>(null);
  const count = itemCount(draft);
  return (
    <aside
      ref={asideRef}
      className="osc-creation-aside u-stack"
      aria-label="Pack"
    >
      <div className="vm-sheet-head">
        <h2 className="vm-sheet-head-title">Pack</h2>
        <span className="vm-sheet-head-hint">
          {count} {count === 1 ? "item" : "items"}
        </span>
      </div>
      <GoldRoll {...props} />
      {draft.cart.length ? (
        <ul className="osc-creation-pack-lines">
          {draft.cart.map(({ item, quantity }) => (
            <li key={item.uuid} className="osc-creation-pack-line">
              <ItemImage img={item.img} />
              <span>
                {item.name}
                {quantity > 1 && ` ×${quantity}`}
              </span>
              <span className="vm-mono">{item.cost * quantity} gp</span>
              <span className="vm-mono">
                {weightText(item.weight * quantity)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="vm-help">Nothing yet. Add items from the shop.</p>
      )}
      <MoreBelow scroller={asideRef} contentKey={draft.cart.length} />
    </aside>
  );
}

export function GearStep(props: Props) {
  const catalog = useCompendiumDetail("gear", props.rules.loadGearCatalog);
  return (
    <div className="osc-creation-split osc-creation-gear-step">
      {catalog.status === "ready" && catalog.detail.length ? (
        <Shop
          catalog={catalog.detail}
          draft={props.draft}
          onChange={props.onChange}
          openSheet={props.rules.openItemSheet}
        />
      ) : (
        <div className="osc-creation-pane">
          <p className="vm-help">
            {catalog.status === "loading"
              ? "Loading the price list…"
              : "No equipment found in the compendiums."}
          </p>
        </div>
      )}
      <Pack {...props} />
    </div>
  );
}
