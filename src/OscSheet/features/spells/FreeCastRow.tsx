import { useState, type ReactNode } from "react";
import type { OseSpell } from "@domain/types";
import { cx } from "@ui/cx";
import { IconButton } from "@ui/IconButton";

type Props = {
  spell: OseSpell;
  meta: ReactNode;
  /** Fires the cast; return the mutation promise so the button can spin. */
  onCast: () => void | Promise<unknown>;
  /** No point budget left at this level → cast disabled. */
  exhausted?: boolean;
  /** When set, renders a favorite star toggle. */
  favorite?: boolean;
  onToggleFavorite?: () => void;
  /** Opens the item sheet from the name. */
  onOpenName?: () => void;
  /** Read-only sheets hide the cast button. Default true. */
  canCast?: boolean;
};

/**
 * A known-spell row for free-casting mode (memorization disabled): name + meta,
 * an optional favorite star, and a cast button gated on the level's point budget
 * (no per-spell memorised/cast pips — casts draw from a shared per-level pool).
 */
export function FreeCastRow({
  spell,
  meta,
  onCast,
  exhausted = false,
  favorite,
  onToggleFavorite,
  onOpenName,
  canCast = true,
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
  return (
    <div className="osc-spell">
      <div className="spinfo">
        <span className="spn-row">
          {onOpenName ? (
            <a className="spn" onClick={onOpenName}>{spell.name}</a>
          ) : (
            <span className="spn">{spell.name}</span>
          )}
        </span>
        <span className="spm">{meta}</span>
      </div>
      <span className="sp-actions">
        {onToggleFavorite && (
          <IconButton
            on={favorite}
            aria-pressed={favorite}
            onClick={onToggleFavorite}
            title={favorite ? `Unfavorite ${spell.name}` : `Favorite ${spell.name}`}
            aria-label={favorite ? `Unfavorite ${spell.name}` : `Favorite ${spell.name}`}
          >
            <i className={cx(favorite ? "fa-solid" : "fa-regular", "fa-star")} aria-hidden="true" />
          </IconButton>
        )}
        {canCast && (
          <button
            type="button"
            className="sp-cast"
            disabled={exhausted || casting}
            aria-busy={casting}
            onClick={handleCast}
            title={exhausted ? "No spell points left at this level (Rest to recover)" : `Cast ${spell.name}`}
          >
            {casting ? <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> : "cast"}
          </button>
        )}
      </span>
    </div>
  );
}
