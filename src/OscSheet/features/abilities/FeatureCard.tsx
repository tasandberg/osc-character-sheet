import { useEffect, useState } from "react";
import type { FeatureVM } from "@features/abilities/features";
import { useOscSheetContext } from "@app/context";
import { cx } from "@ui/cx";
import { IconButton } from "@ui/IconButton";
import { Monogram } from "@ui/Monogram";
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

/** Muted chip under the name. Font SIZE is left out on purpose: the static
 *  requires tag and the clickable roll tag differ there, and Tailwind orders
 *  utilities by its own rules, not by the order they appear on the element — so
 *  a size written "after" this string could still lose to it. */
const FT_TAG =
  "ft-tag tw:rounded-sm tw:border tw:border-border-soft tw:bg-bg-2 tw:px-[7px] tw:pt-[2px] tw:pb-[1px] tw:font-sans tw:whitespace-nowrap tw:text-text-dim";

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
    <div
      className={cx(
        "fvtt-feat tw:overflow-hidden tw:rounded-md tw:border tw:bg-surface",
        // Exclusive strings: Tailwind emits `border-border` BEFORE
        // `border-border-soft`, so an element carrying both comes out soft.
        open ? "tw:border-border" : "tw:border-border-soft",
      )}
    >
      {/* header row: clickable to expand (mouse); name/roll/chevron are their own controls */}
      <div
        className="ft-head tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:px-3 tw:py-2"
        onClick={toggle}
      >
        {/* 40px ink stamp — image or monogram fallback. */}
        <Monogram
          img={feature.img}
          monogram={monogram}
          className="ft-ic tw:grid tw:size-10 tw:flex-none tw:place-items-center tw:rounded-md tw:bg-ink tw:font-display tw:text-[length:var(--fs-xl)] tw:text-stamp-text"
          imgClassName="tw:object-cover"
        />
        <div className="ft-main tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:items-start tw:gap-[3px]">
          <button
            type="button"
            className="ft-title tw:max-w-full tw:cursor-pointer tw:truncate tw:p-0 tw:text-left tw:font-display tw:text-[length:var(--fs-lg)] tw:tracking-[0.01em] tw:text-text tw:transition-[color] tw:duration-[120ms] tw:hover:text-gold tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-gold"
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
                <span className={`${FT_TAG} tw:text-[length:var(--fs-3xs)]`}>{feature.requiresLabel}</span>
              )}
              {feature.rollTag && (
                <button
                  type="button"
                  className={`${FT_TAG} ft-tag-roll tw:cursor-pointer tw:text-[length:var(--fs-2xs)] tw:leading-[1.2] tw:transition-[background,border-color,color] tw:duration-[120ms] tw:hover:border-gold-soft tw:hover:text-gold tw:focus-visible:outline-2 tw:focus-visible:outline-offset-1 tw:focus-visible:outline-gold`}
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
          className="ft-chev tw:text-[length:var(--fs-md)]"
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
        <div className="ft-body tw:pt-0 tw:pr-3 tw:pb-3 tw:pl-[62px]">
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
