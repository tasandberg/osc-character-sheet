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
  /** Brass "L{n}" badge, shown after the spell name. */
  levelTag?: number;
  /** "{left}/{max} · slots" pool readout (Actions free rows). */
  pool?: { used: number; max: number };
  /** Cast-dot pips — one per slot; filled = a cast still ready (prepared rows). */
  pips?: { total: number; filled: number };
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
  const name = onOpenName ? (
    <a className="spn" onClick={onOpenName}>
      {spell.name}
    </a>
  ) : (
    <span className="spn">{spell.name}</span>
  );

  return (
    <div
      className={cx(
        "osc-spell",
        free && "osc-spell-free",
        onToggleFavorite && "has-star",
        spent && "spent",
      )}
    >
      {onToggleFavorite && (
        <IconButton
          on={favorite}
          className="sp-fav"
          aria-pressed={favorite}
          onClick={onToggleFavorite}
          title={favorite ? `Unfavorite ${spell.name}` : `Favorite ${spell.name}`}
          aria-label={favorite ? `Unfavorite ${spell.name}` : `Favorite ${spell.name}`}
        >
          <i className={cx(favorite ? "fa-solid" : "fa-regular", "fa-star")} aria-hidden="true" />
        </IconButton>
      )}
      <div className="spinfo">
        <span className="spn-row">
          {name}
          {badge}
          {pips && (
            <Pips
              total={pips.total}
              filled={pips.filled}
              size="sm"
              role="img"
              aria-label={`${pips.filled} of ${pips.total} casts remaining`}
            />
          )}
          {pool && (
            <span className="pool">
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
        <span className="spm">{meta}</span>
      </div>
      {canCast && (
        <span className="sp-actions">
          <Button
            variant="outline"
            tone="brass"
            size="sm"
            className="sp-cast"
            disabled={spent || casting}
            aria-busy={casting}
            onClick={handleCast}
            title={spent ? (spentTitle ?? `${spell.name} — spent`) : `Cast ${spell.name}`}
          >
            {casting ? (
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
            ) : spent ? (
              "spent"
            ) : (
              "cast"
            )}
          </Button>
        </span>
      )}
    </div>
  );
}
