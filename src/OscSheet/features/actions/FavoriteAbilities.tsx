import type { DragEvent } from "react";
import type { FeatureVM } from "@features/abilities/features";
import { SectionTitle } from "@ui/SectionTitle";
import { Monogram } from "@ui/Monogram";
import { cx } from "@ui/cx";
import { rollable } from "@ui/rollable";

type Props = {
  features: FeatureVM[];
  /** Foundry item drag-data for an ability, so its card drops onto the macro hotbar. */
  dragData?: (itemId: string) => string | undefined;
};

function AbilityCard({
  feature,
  dragData,
}: {
  feature: FeatureVM;
  dragData?: Props["dragData"];
}) {
  const macroDrag = dragData
    ? {
        draggable: true,
        onDragStart: (e: DragEvent<HTMLElement>) => {
          const payload = dragData(feature.id);
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
      className="fvtt-skill rollable osc-fav-ability"
      data-testid={`fav-ability-${feature.id}`}
      title={feature.rollable ? `Roll ${feature.rollTag}` : `Print ${feature.name} to chat`}
      {...rollable(() => feature.onActivate())}
    >
      <Monogram
        img={feature.img}
        monogram={feature.name.charAt(0).toUpperCase()}
        className="skic tw:grid tw:size-5 tw:place-items-center tw:rounded-sm tw:bg-ink tw:font-display tw:text-[length:var(--fs-2xs)] tw:text-stamp-text"
        imgClassName="tw:object-cover"
        data-testid={`fav-ability-img-${feature.id}`}
        {...macroDrag}
      />
      <span className="skn tw:flex tw:min-w-0 tw:flex-wrap tw:items-baseline tw:gap-x-2">
        <button
          type="button"
          className="tw:min-w-0 tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0 tw:text-left tw:text-inherit tw:hover:text-gold tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-gold"
          data-testid={`fav-ability-name-${feature.id}`}
          title={`Open ${feature.name}`}
          onClick={(e) => {
            e.stopPropagation();
            feature.onOpen();
          }}
        >
          {feature.name}
        </button>
        {feature.rollTargetTag && (
          <span
            className="tw:font-mono tw:whitespace-nowrap tw:text-text-mute"
            data-testid={`fav-ability-target-${feature.id}`}
          >
            {feature.rollTargetTag}
          </span>
        )}
      </span>
      <span className="skv" data-testid={`fav-ability-roll-${feature.id}`}>
        {feature.rollFormula ?? "chat"}
        <i
          className={cx("fa-solid", feature.rollable ? "fa-dice-d20" : "fa-comment")}
          aria-hidden="true"
        />
      </span>
    </div>
  );
}

/** Favorited ability items, quick-rollable from the Actions tab. Passive abilities
 *  (no formula) print to chat instead — `item.roll()` covers both. */
export function FavoriteAbilities({ features, dragData }: Props) {
  if (features.length === 0) return null;

  return (
    <section className="osc-section">
      <SectionTitle hint="favorites — click to roll">Abilities</SectionTitle>
      <div className="fvtt-explore">
        {features.map((feature) => (
          <AbilityCard key={feature.id} feature={feature} dragData={dragData} />
        ))}
      </div>
    </section>
  );
}
