import { useEffect, useState } from "react";
import type { FeatureVM } from "@features/abilities/features";
import { useReactorSheetContext } from "@app/context";
import { cx } from "@ui/cx";
import { IconButton } from "@ui/IconButton";
import { Monogram } from "@ui/Monogram";

/** Enrich raw HTML once via Foundry's TextEditor (links, inline rolls, embeds). */
function useEnriched(html: string): string {
  const { actor } = useReactorSheetContext();
  const [enriched, setEnriched] = useState(html);
  useEffect(() => {
    let live = true;
    foundry.applications.ux.TextEditor.enrichHTML(html, {
      secrets: false,
      documents: true,
      links: true,
      rolls: true,
      embeds: true,
      relativeTo: actor,
    }).then((out) => {
      if (live) setEnriched(out);
    });
    return () => {
      live = false;
    };
  }, [html, actor]);
  return enriched;
}

/**
 * Collapsible ability: ink-stamp · (name link + requires/roll tags) · chevron.
 * The name opens the ability's own sheet; the roll tag rolls; the chevron (or a
 * click anywhere else on the header) expands the description.
 */
export function FeatureCard({ feature }: { feature: FeatureVM }) {
  const [open, setOpen] = useState(false);
  const desc = useEnriched(feature.description);
  const monogram = feature.name.charAt(0).toUpperCase();
  const toggle = () => setOpen((o) => !o);

  return (
    <div className={cx("fvtt-feat", open && "open")}>
      {/* header row: clickable to expand (mouse); name/roll/chevron are their own controls */}
      <div className="ft-head" onClick={toggle}>
        <Monogram img={feature.img} monogram={monogram} className="ft-ic" />
        <div className="ft-main">
          <button
            type="button"
            className="ft-title"
            title={`Open ${feature.name}`}
            onClick={(e) => {
              e.stopPropagation();
              feature.onOpen();
            }}
          >
            {feature.name}
          </button>
          {(feature.requiresLabel || feature.rollTag) && (
            <div className="ft-tags">
              {feature.requiresLabel && <span className="ft-tag">{feature.requiresLabel}</span>}
              {feature.rollTag && (
                <button
                  type="button"
                  className="ft-tag ft-tag-roll"
                  title={`Roll ${feature.rollTag}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    feature.onRoll?.();
                  }}
                >
                  Roll {feature.rollTag}
                </button>
              )}
            </div>
          )}
        </div>
        <IconButton
          className="ft-chev"
          aria-expanded={open}
          aria-label={open ? "Collapse" : "Expand"}
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </IconButton>
      </div>
      {open && (
        <div className="ft-body">
          <div
            className="ft-desc"
            dangerouslySetInnerHTML={{ __html: desc }}
          />
          <div className="ft-actions">
            <IconButton
              variant="danger"
              title="Delete ability"
              aria-label="Delete ability"
              onClick={feature.onDelete}
            >
              <i className="fas fa-trash" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
