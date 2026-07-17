import { useState, type ReactNode } from "react";
import type { OseSpell } from "@domain/types";
import { cx } from "@ui/cx";
import { IconButton } from "@ui/IconButton";
import { Tag } from "@ui/Tag";

type Props = {
  spell: OseSpell;
  meta: ReactNode;
  /** Fires the cast; return the mutation promise so the button can spin. */
  onCast: () => void | Promise<unknown>;
  /** No point budget left at this level → row struck, button muted "spent". */
  exhausted?: boolean;
  /** Spells tab: leading favorite star. */
  favorite?: boolean;
  onToggleFavorite?: () => void;
  /** Actions tab: brass "L{n}" level tag before the name. */
  levelTag?: number;
  /** Actions tab: inline "{left}/{max} · slots" pool readout after the name. */
  pool?: { used: number; max: number };
  /** Opens the item sheet from the name. */
  onOpenName?: () => void;
  /** Read-only sheets hide the cast button. Default true. */
  canCast?: boolean;
};

/**
 * A known-spell row for free-casting mode (memorization disabled): an optional
 * favorite star, name, R/D/save meta, and a cast button gated on the level's
 * shared point pool (no per-spell memorised/cast pips). Used on the Spells tab
 * (star, per-level panel) and the Actions tab (level tag + inline pool).
 */
export function FreeCastRow({
  spell,
  meta,
  onCast,
  exhausted = false,
  favorite,
  onToggleFavorite,
  levelTag,
  pool,
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
    <div className={cx("osc-spell osc-spell-free", onToggleFavorite && "has-star", exhausted && "spent")}>
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
          {levelTag != null && <Tag intent="brass">L{levelTag}</Tag>}
          {onOpenName ? (
            <a className="spn" onClick={onOpenName}>{spell.name}</a>
          ) : (
            <span className="spn">{spell.name}</span>
          )}
          {pool && (
            <span className="pool">
              {pool.max - pool.used}/{pool.max} · slots
            </span>
          )}
        </span>
        <span className="spm">{meta}</span>
      </div>
      {canCast && (
        <span className="sp-actions">
          <button
            type="button"
            className="sp-cast"
            disabled={exhausted || casting}
            aria-busy={casting}
            onClick={handleCast}
            title={exhausted ? "No spell points left at this level (Study to recover)" : `Cast ${spell.name}`}
          >
            {casting ? <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> : exhausted ? "spent" : "cast"}
          </button>
        </span>
      )}
    </div>
  );
}
