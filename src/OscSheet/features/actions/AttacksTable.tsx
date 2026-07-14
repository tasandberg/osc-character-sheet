import { useState, type DragEvent, type MouseEvent } from "react";
import type { AttackKind } from "@domain/types";
import type { AttackVM, RollSpec } from "@domain/vm-types";
import { SectionTitle } from "@ui/SectionTitle";
import { Tag } from "@ui/Tag";
import { cx } from "@ui/cx";
import { Monogram } from "@ui/Monogram";
import { Button } from "@src/OscSheet/components/ui";

type Props = {
  attacks: AttackVM[];
  /** Roll a hit/damage formula (custom roll). */
  onRoll?: (spec: RollSpec) => void;
  /** Composite attack roll for the active mode. Event carries ctrl/meta (skip dialog). */
  onAttack?: (
    itemId: string,
    kind: AttackKind,
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  /** Open the weapon's item sheet (click the name). */
  onOpen?: (itemId: string) => void;
  /** Foundry item drag-data for a weapon, so its card drops onto the macro hotbar
   *  to create an attack macro (same as an inventory row). undefined = not draggable. */
  dragData?: (itemId: string) => string | undefined;
  /** The composite Attack roll can write to the actor/item (e.g. missile ammo
   *  decrement), so it's owner-only. false renders the Attack button disabled
   *  (read-only sheet), not hidden. Default true. */
  canAttack?: boolean;
};

/** Monogram glyph for the ink-stamp weapon icon (first letter, Title-case). */
function monogram(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

const kindIcon = (kind: AttackKind) =>
  kind === "melee" ? "fa-sword" : "fa-bow-arrow";

/** One weapon card. A melee+missile weapon shows both kind tags as a toggle
 *  (melee active by default); the active mode drives Hit/Dmg. */
function WeaponRow({
  a,
  onRoll,
  onAttack,
  onOpen,
  dragData,
  canAttack = true,
}: {
  a: AttackVM;
  onRoll?: Props["onRoll"];
  onAttack?: Props["onAttack"];
  onOpen?: Props["onOpen"];
  dragData?: Props["dragData"];
  canAttack?: boolean;
}) {
  const [active, setActive] = useState(0); // index into a.modes (melee = 0)
  const mode = a.modes[active] ?? a.modes[0];
  const dual = a.modes.length > 1;

  // Drag the weapon image or the Attack button onto the macro hotbar → OSE's
  // hotbarDrop creates an attack macro (same payload as the inventory row).
  const macroDrag = dragData
    ? {
        draggable: true,
        onDragStart: (e: DragEvent<HTMLElement>) => {
          const payload = dragData(a.itemId);
          if (!payload) {
            e.preventDefault();
            return;
          }
          e.dataTransfer.effectAllowed = "all";
          try {
            e.dataTransfer.setData("text/plain", payload);
          } catch {
            /* IE guard */
          }
        },
      }
    : {};

  return (
    <div
      className="osc-weapon"
      role="row"
      data-testid={`weapon-row-${a.itemId}`}
    >
      <div className="winfo">
        <Monogram
          img={a.img}
          monogram={monogram(a.name)}
          className="wic"
          imgClassName="wic-img"
          data-testid={`weapon-img-${a.itemId}`}
          {...macroDrag}
        />
        <div className="wmain">
          <div className="wname">
            {onOpen ? (
              <button
                type="button"
                className="wname-btn"
                data-testid={`weapon-name-${a.itemId}`}
                onClick={() => onOpen(a.itemId)}
                title={`Open ${a.name}`}
              >
                {a.name}
              </button>
            ) : (
              a.name
            )}{" "}
            <span className="wkind">({mode.kindLabel.toLowerCase()})</span>
          </div>
          <div className="wtags">
            {/* dual melee+missile → a segmented switch; single mode → a static tag */}
            {dual ? (
              <div
                className="kind-switch"
                role="group"
                aria-label="Attack mode"
              >
                {a.modes.map((m, i) => (
                  <button
                    type="button"
                    key={m.kind}
                    data-testid={`attack-mode-${m.kind}-${a.itemId}`}
                    className={cx(
                      "kind-seg",
                      m.kind,
                      i === active && "selected",
                    )}
                    aria-pressed={i === active}
                    onClick={() => setActive(i)}
                    title={`${m.kindLabel} attack`}
                  >
                    <i
                      className={cx("fa-solid", kindIcon(m.kind))}
                      aria-hidden="true"
                    />
                    <span className="tag-pop" role="tooltip">
                      {m.kindLabel}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <Tag
                variant="chip"
                className={a.modes[0].kind}
                icon={kindIcon(a.modes[0].kind)}
                tooltip={a.modes[0].kindLabel}
                title={a.modes[0].kindLabel}
              />
            )}
            {a.qualities.map((q) => (
              <Tag
                variant="chip"
                key={q.label}
                title={q.label}
                icon={q.icon || undefined}
                tooltip={q.icon ? q.label : undefined}
              >
                {q.icon ? null : <span className="tag-txt">{q.label}</span>}
              </Tag>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="wstat hit"
        data-testid={`weapon-hit-${a.itemId}`}
        disabled={!onRoll}
        onClick={() => onRoll?.(mode.hit)}
        title={`Roll to hit · ${mode.hitTip}`}
      >
        <span className="sl">Hit</span>
        <span className="wv">
          <i
            className={cx("fa-solid", kindIcon(mode.kind))}
            aria-hidden="true"
          />
          {mode.hitDisplay}
        </span>
        <span className="tag-pop" role="tooltip">
          {mode.hitTip}
        </span>
      </button>
      <button
        type="button"
        className="wstat dmg"
        disabled={!onRoll}
        onClick={() => onRoll?.(mode.dmg)}
        title={`Roll damage · ${mode.dmgTip}`}
      >
        <span className="sl">Dmg</span>
        <span className="wv">{mode.dmgDisplay}</span>
        <span className="tag-pop" role="tooltip">
          {mode.dmgTip}
        </span>
      </button>

      {/* Always rendered; read-only (non-owner) shows it disabled — the composite
          Attack roll can write to the actor/item, so it's inert without canAttack.
          Drag-to-hotbar is owner-only too, so macroDrag is omitted when disabled. */}
      <Button
        data-testid={`weapon-attack-${a.itemId}`}
        {...(canAttack ? macroDrag : {})}
        disabled={!canAttack || !onAttack}
        onClick={(e) => onAttack?.(a.itemId, mode.kind, e)}
        title="Attack roll (hit + damage)"
        variant="outline"
        tone="brass"
        aria-label={`Attack with ${a.name}`}
      >
        <i className="fa-solid fa-dice-d20 u-mr-1" aria-hidden="true" />
        <span>Attack</span>
      </Button>
    </div>
  );
}

/** Equipped-weapon attacks as woodcut weapon cards: ink-stamp monogram, name +
 *  melee/missile + quality tags, clickable HIT/DMG stat cells (FA dice), and a
 *  tall brass Attack button (full hit + damage for the active mode). */
export function AttacksTable({
  attacks,
  onRoll,
  onAttack,
  onOpen,
  dragData,
  canAttack = true,
}: Props) {
  return (
    <section className="osc-section osc-atk">
      <SectionTitle hint="click to roll">Attacks</SectionTitle>
      <div className="osc-wtable">
        {attacks.map((a) => (
          <WeaponRow
            key={a.id}
            a={a}
            onRoll={onRoll}
            onAttack={onAttack}
            onOpen={onOpen}
            dragData={dragData}
            canAttack={canAttack}
          />
        ))}
      </div>
    </section>
  );
}
