import { useEffect, useState } from "react";
import type { FeatureVM } from "@features/abilities/features";
import { useOscSheetContext } from "@app/context";
import { IconButton } from "@ui/IconButton";
import { Monogram } from "@ui/Monogram";
import { FavoriteStar } from "@features/abilities/FavoriteStar";
import { RichText } from "@ui/RichText";

/** Enrich raw HTML once via Foundry's TextEditor (links, inline rolls, embeds). */
function useEnriched(html: string): string {
  const { actor } = useOscSheetContext();
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

/** Muted chip under the name. */
const FT_TAG = "ft-tag vm-tag vm-tag-xs";

/**
 * Collapsible ability: ink-stamp · (name link + requires/roll tags) · chevron.
 * The name opens the ability's own sheet; the roll tag rolls; the chevron (or a
 * click anywhere else on the header) expands the description.
 */
export function FeatureCard({ feature }: { feature: FeatureVM }) {
  const { canEdit } = useOscSheetContext();
  const [open, setOpen] = useState(false);
  const desc = useEnriched(feature.description);
  const monogram = feature.name.charAt(0).toUpperCase();
  const toggle = () => setOpen((o) => !o);

  return (
    <div className="fvtt-feat osc-ruled-row">
      {/* header row: clickable to expand (mouse); name/roll/chevron are their own controls */}
      <div
        className="ft-head tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:py-2"
        onClick={toggle}
      >
        {/* 40px ink stamp — image or monogram fallback. */}
        <Monogram
          img={feature.img}
          monogram={monogram}
          className="ft-ic tw:grid tw:size-10 tw:flex-none tw:place-items-center tw:bg-ink tw:font-semibold tw:text-(length:--fs-lg) tw:text-stamp-text"
          imgClassName="tw:object-cover"
        />
        <div className="ft-main tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:items-start tw:gap-[3px]">
          <button
            type="button"
            className="ft-title tw:max-w-full tw:cursor-pointer tw:truncate tw:p-0 tw:text-left tw:font-semibold tw:text-(length:--fs-md) tw:text-text tw:transition-[color] tw:duration-[120ms] tw:hover:text-gold tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-gold"
            title={`Open ${feature.name}`}
            onClick={(e) => {
              e.stopPropagation();
              feature.onOpen();
            }}
          >
            {feature.name}
          </button>
          {(feature.requiresLabel || feature.rollTag) && (
            <div className="ft-tags tw:flex tw:flex-wrap tw:gap-1">
              {feature.requiresLabel && (
                <span className={FT_TAG}>{feature.requiresLabel}</span>
              )}
              {feature.rollTag && (
                <button
                  type="button"
                  className={`${FT_TAG} ft-tag-roll tw:cursor-pointer tw:transition-[border-color,color] tw:duration-[120ms] tw:hover:border-gold-soft tw:hover:text-gold tw:focus-visible:outline-2 tw:focus-visible:outline-offset-1 tw:focus-visible:outline-gold`}
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
        {canEdit && (
          <FavoriteStar
            className="ft-fav"
            name={feature.name}
            favorite={feature.favorite}
            onToggle={feature.onToggleFavorite}
          />
        )}
        <IconButton
          className="ft-chev tw:text-(length:--fs-md)"
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
        // Body indented under the title (past the 40px stamp + gap).
        <div className="ft-body tw:pt-0 tw:pb-3 tw:pl-[52px]">
          <RichText html={desc} />
          {canEdit && (
            <div className="ft-actions tw:mt-2 tw:flex tw:items-center tw:justify-end tw:gap-3">
              <IconButton
                variant="danger"
                title="Delete ability"
                aria-label="Delete ability"
                onClick={feature.onDelete}
              >
                <i className="fas fa-trash" aria-hidden="true" />
              </IconButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
