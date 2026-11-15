import type { DragEvent } from "react";
import type { FeatureVM } from "@features/abilities/features";
import { SectionTitle } from "@ui/SectionTitle";
import { Monogram } from "@ui/Monogram";
import { cx } from "@ui/cx";
import { IconButton } from "@ui/IconButton";

const DIE_ICONS: Record<string, string> = {
  "4": "fa-dice-d4",
  "6": "fa-dice-d6",
  "8": "fa-dice-d8",
  "10": "fa-dice-d10",
  "12": "fa-dice-d12",
  "20": "fa-dice-d20",
  "100": "fa-dice-d20",
};

function dieIcon(formula?: string) {
  const sides = /d(\d+)/.exec(formula ?? "")?.[1];
  return (sides && DIE_ICONS[sides]) || "fa-dice";
}

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

  const activateLabel = feature.rollable
    ? `Roll ${feature.rollTag}`
    : `Print ${feature.name} to chat`;
  return (
    <div
      className="fvtt-skill osc-fav-ability"
      data-testid={`fav-ability-${feature.id}`}
    >
      <Monogram
        img={feature.img}
        monogram={feature.name.charAt(0).toUpperCase()}
        className="skic tw:grid tw:size-5 tw:place-items-center tw:bg-ink tw:font-semibold tw:text-(length:--fs-2xs) tw:text-stamp-text"
        imgClassName="tw:object-cover"
        data-testid={`fav-ability-img-${feature.id}`}
        {...macroDrag}
      />
      <span className="skn tw:flex tw:min-w-0 tw:items-baseline tw:gap-x-2">
        <button
          type="button"
          className="tw:min-w-0 tw:truncate tw:cursor-pointer tw:border-0 tw:bg-transparent tw:p-0 tw:text-left tw:text-inherit tw:hover:text-gold tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-gold"
          data-testid={`fav-ability-name-${feature.id}`}
          title={`Open ${feature.name}`}
          onClick={() => feature.onOpen()}
        >
          {feature.name}
        </button>
        {feature.rollTargetTag && (
          <span
            className="tw:flex-none tw:whitespace-nowrap tw:text-(length:--fs-xs) tw:text-text-mute"
            data-testid={`fav-ability-target-${feature.id}`}
          >
            {feature.rollTargetTag}
          </span>
        )}
      </span>
      <span className="skv" data-testid={`fav-ability-roll-${feature.id}`}>
        {feature.rollFormula ?? "chat"}
      </span>
      <IconButton
        variant="raised"
        className="osc-icon-tone-brass"
        title={activateLabel}
        aria-label={activateLabel}
        onClick={() => feature.onActivate()}
      >
        <i
          className={cx(
            "fa-solid",
            feature.rollable ? dieIcon(feature.rollFormula) : "fa-comment",
          )}
          aria-hidden="true"
        />
      </IconButton>
    </div>
  );
}

/** Favorited ability items, quick-rollable from the Actions tab. Passive abilities
 *  (no formula) print to chat instead — `item.roll()` covers both. */
export function FavoriteAbilities({ features, dragData }: Props) {
  if (features.length === 0) return null;

  return (
    <section className="osc-section">
      <SectionTitle>Abilities</SectionTitle>
      <div className="fvtt-explore osc-fav-abilities osc-ruled-grid">
        {features.map((feature) => (
          <AbilityCard key={feature.id} feature={feature} dragData={dragData} />
        ))}
      </div>
    </section>
  );
}
