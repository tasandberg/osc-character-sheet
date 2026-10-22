import { Fragment, useState, type DragEvent, type MouseEvent } from "react";
import type { AttackKind } from "@domain/types";
import type { AttackVM, RollSpec } from "@domain/vm-types";
import { SectionTitle } from "@ui/SectionTitle";
import { IconButton } from "@ui/IconButton";
import { Tag } from "@ui/Tag";
import { cx } from "@ui/cx";
import { Monogram } from "@ui/Monogram";
import { TargetDialog } from "@features/actions/TargetDialog";
import type { AttackTargetVM } from "@features/actions/attackTargets";

export type AttackTargeting = {
  listTargets: () => AttackTargetVM[];
  current: AttackTargetVM | null;
  onTarget: (tokenId: string) => void;
  onClearTarget: () => void;
  promptForTarget: boolean;
};

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
  targeting?: AttackTargeting;
};

type TargetPrompt = {
  targets: AttackTargetVM[];
  rollType?: string;
  proceed?: () => void;
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
      className="osc-weapon osc-ruled-row"
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
          <div className="wline">
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
              <span className="wdice">{mode.dmgDie}</span>
            </div>
          </div>
          <div className="wtags">
            {dual && (
              <div
                className="vm-segmented osc-segmented-sm"
                role="radiogroup"
                aria-label="Attack mode"
              >
                {a.modes.map((m, i) => (
                  <label
                    key={m.kind}
                    data-testid={`attack-mode-${m.kind}-${a.itemId}`}
                    className="vm-segment kind-seg"
                    title={`${m.kindLabel} attack`}
                  >
                    <input
                      type="radio"
                      className="vm-segment-input"
                      name={`attack-mode-${a.itemId}`}
                      checked={i === active}
                      onChange={() => setActive(i)}
                      aria-label={`${m.kindLabel} attack`}
                    />
                    <i
                      className={cx("fa-solid", kindIcon(m.kind))}
                      aria-hidden="true"
                    />
                    <span className="tag-pop" role="tooltip">
                      {m.kindLabel}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {!dual && (
              <Tag
                variant="chip"
                className={a.modes[0].kind}
                icon={kindIcon(a.modes[0].kind)}
                tooltip={a.modes[0].kindLabel}
                title={a.modes[0].kindLabel}
              />
            )}
            {a.qualities.map((q) => (
              <Fragment key={q.label}>
                <Tag
                  variant="chip"
                  className="u-foundry-lg-display-none"
                  title={q.label}
                  icon={q.icon || undefined}
                  tooltip={q.icon ? q.label : undefined}
                >
                  {q.icon ? null : <span className="tag-txt">{q.label}</span>}
                </Tag>
                <Tag
                  size="xs"
                  icon={q.icon || undefined}
                  className="u-foundry-xs-display-none u-foundry-lg-display-inline-flex"
                >
                  {q.label}
                </Tag>
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <IconButton
        variant="raised"
        className="osc-roll-button wstat hit"
        data-testid={`weapon-hit-${a.itemId}`}
        disabled={!onRoll}
        onClick={() => onRoll?.(mode.hit)}
        aria-label={`Roll to hit · ${mode.hitTip}`}
      >
        <span className="sl">Hit</span>
        <span className="wv">{mode.hitDisplay}</span>
        <span className="tag-pop" role="tooltip">
          {`Roll to hit · ${mode.hitTip}`}
        </span>
      </IconButton>
      <IconButton
        variant="raised"
        className="osc-roll-button wstat dmg"
        disabled={!onRoll}
        onClick={() => onRoll?.(mode.dmg)}
        aria-label={`Roll damage · ${mode.dmgTip}`}
      >
        <span className="sl">Dmg</span>
        <span className="wv">{mode.dmgModDisplay}</span>
        <span className="tag-pop" role="tooltip">
          {`Roll damage · ${mode.dmgTip}`}
        </span>
      </IconButton>

      {/* Always rendered; read-only (non-owner) shows it disabled — the composite
          Attack roll can write to the actor/item, so it's inert without canAttack.
          Drag-to-hotbar is owner-only too, so macroDrag is omitted when disabled. */}
      <IconButton
        variant="raised"
        className="osc-roll-button osc-icon-tone-brass"
        data-testid={`weapon-attack-${a.itemId}`}
        {...(canAttack ? macroDrag : {})}
        disabled={!canAttack || !onAttack}
        onClick={(e) => onAttack?.(a.itemId, mode.kind, e)}
        title="Attack roll (hit + damage)"
        aria-label={`Attack with ${a.name}`}
      >
        <i className="fa-solid fa-dice-d20" aria-hidden="true" />
        <span>Attack</span>
      </IconButton>
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
  targeting,
}: Props) {
  const [prompt, setPrompt] = useState<TargetPrompt | null>(null);

  const openPrompt = (rollType?: string, proceed?: () => void) =>
    targeting &&
    setPrompt({ targets: targeting.listTargets(), rollType, proceed });

  const guard = (rollType: string, run: () => void) => {
    if (targeting?.promptForTarget && !targeting.current)
      openPrompt(rollType, run);
    else run();
  };

  const guardedRoll = (a: AttackVM) =>
    onRoll &&
    ((spec: RollSpec) => {
      const kind = a.modes.some((m) => m.dmg === spec) ? "damage" : "hit";
      guard(`${a.name} ${kind}`, () => onRoll(spec));
    });
  const guardedAttack = (a: AttackVM) =>
    onAttack &&
    ((itemId: string, kind: AttackKind, event: MouseEvent<HTMLButtonElement>) =>
      guard(`${a.name} attack`, () => onAttack(itemId, kind, event)));

  const confirm = (target: AttackTargetVM | null) => {
    const proceed = prompt?.proceed;
    setPrompt(null);
    if (target) targeting?.onTarget(target.id);
    proceed?.();
  };

  return (
    <section className="osc-section" data-testid="attacks">
      <SectionTitle>
        Attacks
        <span className="hint">click to roll</span>
        {targeting &&
          (targeting.current ? (
            <span className="osc-attack-target-current u-row u-nowrap u-gap-1 u-fs-xs tw:self-center tw:font-sans">
              <i
                className="fa-solid fa-crosshairs u-text-dim"
                aria-hidden="true"
              />
              <span className="u-text">{targeting.current.name}</span>
              <IconButton
                size="sm"
                aria-label="Clear target"
                title="Clear target"
                onClick={targeting.onClearTarget}
              >
                ×
              </IconButton>
            </span>
          ) : (
            <IconButton
              className="osc-attack-target-btn tw:self-center"
              onClick={() => openPrompt()}
            >
              <i className="fa-solid fa-crosshairs" aria-hidden="true" />
              Target
            </IconButton>
          ))}
      </SectionTitle>
      <div className="tw:flex tw:flex-col">
        {attacks.map((a) => (
          <WeaponRow
            key={a.id}
            a={a}
            onRoll={guardedRoll(a)}
            onAttack={guardedAttack(a)}
            onOpen={onOpen}
            dragData={dragData}
            canAttack={canAttack}
          />
        ))}
      </div>
      {prompt && (
        <TargetDialog
          targets={prompt.targets}
          rollType={prompt.rollType}
          onCancel={() => setPrompt(null)}
          onConfirm={confirm}
        />
      )}
    </section>
  );
}
