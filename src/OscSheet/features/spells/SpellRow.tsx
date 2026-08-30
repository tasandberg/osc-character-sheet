import { useState, type ReactNode } from "react";
import type { OseSpell } from "@domain/types";
import { cx } from "@ui/cx";
import { Button } from "@ui/Button";
import { IconButton } from "@ui/IconButton";
import { Pips } from "@ui/Pips";
import { SpellLevelBadge } from "@features/spells/SpellLevelBadge";

type Props = {
  spell: OseSpell;
  meta: ReactNode;
  /** Fires the cast; return the mutation promise so the button can spin. */
  onCast: () => void | Promise<unknown>;
  /** Opens the item sheet from the name. */
  onOpenName?: () => void;
  /** Read-only sheets hide the cast button. Default true. */
  canCast?: boolean;
  /** Free-casting styling (pool colour, badge strike-through). */
  free?: boolean;
  /** No casts/points left → struck row + muted "spent" button. */
  spent?: boolean;
  /** Tooltip when spent — the recover hint differs by mode (Rest vs Study). */
  spentTitle?: string;
  /** Leading favorite star (Spells-tab free rows). */
  favorite?: boolean;
  onToggleFavorite?: () => void;
  /** Trailing unprepare trash (Spells-tab prepared rows). */
  onUnprepare?: () => void;
  /** Deletes the spell item outright — sits after Cast (Spells-tab free rows). */
  onDelete?: () => void;
  /** Brass "L{n}" badge, shown after the spell name. */
  levelTag?: number;
  /** "{left}/{max} · slots" pool readout (Actions free rows). */
  pool?: { used: number; max: number };
  /** Cast-dot pips — one per slot; filled = a cast still ready (prepared rows).
   *  `onSet` makes them clickable to spend/restore casts directly. */
  pips?: { total: number; filled: number; onSet?: (n: number) => void };
};

/**
 * The one spell row, shared by the Spells tab and the Actions quick-cast list, in
 * both memorization modes. It's presentational: the caller supplies whichever
 * affordances that context needs (star, level badge, pool, pips, unprepare) and the
 * row renders them — so cast/spent styling lives in ONE place.
 */
export function SpellRow({
  spell,
  meta,
  onCast,
  onOpenName,
  canCast = true,
  free = false,
  spent = false,
  spentTitle,
  favorite = false,
  onToggleFavorite,
  onUnprepare,
  onDelete,
  levelTag,
  pool,
  pips,
}: Props) {
  const [casting, setCasting] = useState(false);
  const handleCast = async () => {
    if (casting) return;
    setCasting(true);
    try {
      await onCast();
    } finally {
      setCasting(false);
    }
  };

  const badge = levelTag != null ? <SpellLevelBadge level={levelTag} /> : null;
  // Exclusive strings: a spent row is struck and muted, and loses the gold
  // hover with it (the old `.osc-spell.spent .spn` won over `.spn:hover`).
  const spn = cx(
    "spn tw:cursor-pointer tw:font-display tw:text-[length:var(--fs-lg)]",
    spent
      ? "tw:text-text-mute tw:line-through"
      : "tw:text-text tw:hover:text-gold",
  );
  const name = onOpenName ? (
    <a className={spn} onClick={onOpenName}>
      {spell.name}
    </a>
  ) : (
    <span className={spn}>{spell.name}</span>
  );

  return (
    <div
      className={cx(
        // The `.fvtt-castlist` framing rules in spells.scss out-specify the
        // border utilities here on purpose — that list is headerless and needs
        // its first row's top edge back.
        "osc-spell tw:grid tw:items-center tw:gap-2 tw:border tw:border-t-0 tw:border-border-soft tw:bg-surface tw:px-3 tw:py-2",
        // A leading favorite-star column turns the 2-col grid into 3.
        onToggleFavorite
          ? "has-star tw:grid-cols-[auto_1fr_auto]"
          : "tw:grid-cols-[1fr_auto]",
        free && "osc-spell-free",
        spent && "spent",
      )}
    >
      {onToggleFavorite && (
        <IconButton
          on={favorite}
          className="sp-fav"
          aria-pressed={favorite}
          onClick={onToggleFavorite}
          title={
            favorite ? `Unfavorite ${spell.name}` : `Favorite ${spell.name}`
          }
          aria-label={
            favorite ? `Unfavorite ${spell.name}` : `Favorite ${spell.name}`
          }
        >
          <i
            className={cx(favorite ? "fa-solid" : "fa-regular", "fa-star")}
            aria-hidden="true"
          />
        </IconButton>
      )}
      <div className="spinfo tw:min-w-0">
        {/* name + cast dots on one line (dots to the right of the name) */}
        <span className="spn-row tw:inline-flex tw:min-w-0 tw:items-baseline tw:gap-2">
          {name}
          {badge}
          {pips && (
            <Pips
              total={pips.total}
              filled={pips.filled}
              size="sm"
              role={pips.onSet ? "group" : "img"}
              aria-label={`${pips.filled} of ${pips.total} casts remaining`}
              onSetFilled={pips.onSet}
            />
          )}
          {pool && (
            <span
              className={cx(
                "pool tw:font-mono tw:text-(length:--fs-3xs) tw:whitespace-nowrap",
                spent ? "tw:text-text-faint" : "tw:text-text-mute",
              )}
            >
              {pool.max - pool.used}/{pool.max} · slots
            </span>
          )}
          {onUnprepare && (
            <IconButton
              variant="danger"
              size="sm"
              onClick={onUnprepare}
              title={`Remove ${spell.name}`}
              aria-label={`Remove ${spell.name}`}
            >
              <i className="fa-solid fa-trash-can" aria-hidden="true" />
            </IconButton>
          )}
        </span>
        {/* the " · " separators and the .dmg tint stay in spells.scss */}
        <span className="spm tw:mt-px tw:block tw:font-mono tw:text-(length:--fs-3xs) tw:text-text-mute">
          {meta}
        </span>
      </div>
      {(canCast || onDelete) && (
        <span className="sp-actions tw:inline-flex tw:items-center tw:gap-2">
          {canCast && (
            <Button
              variant="outline"
              tone="brass"
              size="sm"
              className="sp-cast tw:font-sans"
              disabled={spent || casting}
              aria-busy={casting}
              onClick={handleCast}
              title={
                spent
                  ? (spentTitle ?? `${spell.name} — spent`)
                  : `Cast ${spell.name}`
              }
            >
              {casting ? (
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
              ) : spent ? (
                "spent"
              ) : (
                "cast"
              )}
            </Button>
          )}
          {onDelete && (
            <IconButton
              variant="danger"
              size="sm"
              className="sp-delete"
              onClick={onDelete}
              title={`Delete ${spell.name}`}
              aria-label={`Delete ${spell.name}`}
            >
              <i className="fa-solid fa-trash-can" aria-hidden="true" />
            </IconButton>
          )}
        </span>
      )}
    </div>
  );
}
