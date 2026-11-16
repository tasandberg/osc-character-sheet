import { useEffect, useState } from "react";
import type { FeatureVM } from "@features/abilities/features";
import { useOscSheetContext } from "@app/context";
import { IconButton } from "@ui/IconButton";
import { DisclosureRow, RowIcon, DISCLOSURE_INDENT } from "@ui/DisclosureRow";
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

const FT_TAG = "ft-tag vm-tag vm-tag-xs";

export function FeatureCard({ feature }: { feature: FeatureVM }) {
  const { canEdit } = useOscSheetContext();
  const [open, setOpen] = useState(false);
  const desc = useEnriched(feature.description);
  const toggle = () => setOpen((o) => !o);

  return (
    <div className="fvtt-feat osc-ruled-row">
      <DisclosureRow
        label={open ? "Collapse" : "Expand"}
        expanded={open}
        onToggle={toggle}
        onClick={toggle}
        className="tw:cursor-pointer"
      >
        <RowIcon img={feature.img} name={feature.name} />
        <div className="ft-main tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:items-start u-gap-1 tw:@md/app:flex-row tw:@md/app:flex-wrap tw:@md/app:items-center tw:@md/app:gap-x-2">
          <button
            type="button"
            className="ft-title tw:max-w-full tw:cursor-pointer tw:truncate tw:p-0 tw:text-left tw:font-normal tw:text-(length:--fs-md) tw:text-text tw:transition-[color] tw:duration-[120ms] tw:hover:text-gold tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-gold"
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
      </DisclosureRow>
      {open && (
        <div className={`ft-body u-pb-2 ${DISCLOSURE_INDENT}`}>
          <RichText html={desc} />
          {canEdit && (
            <div className="ft-actions u-mt-2 u-flex u-items-center u-justify-end u-gap-3">
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
