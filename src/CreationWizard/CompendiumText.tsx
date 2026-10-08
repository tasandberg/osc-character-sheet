import type { ReactNode } from "react";
import { Skeleton } from "@ui/Skeleton";
import type { Loaded } from "./useCompendiumDetail";

export function CompendiumDescription({
  loaded,
  noun,
}: {
  loaded: Loaded<{ description: string }>;
  noun: string;
}) {
  if (loaded.status === "loading")
    return (
      <div className="u-stack u-gap-2" aria-busy="true" aria-label="Loading">
        <Skeleton height="var(--spacer-4)" />
        <Skeleton height="var(--spacer-4)" />
        <Skeleton width="60%" height="var(--spacer-4)" />
      </div>
    );
  if (loaded.status === "failed")
    return (
      <p className="vm-help">Couldn’t load this {noun} from the compendiums.</p>
    );
  if (!loaded.detail.description)
    return (
      <p className="vm-help">No {noun} description found in the compendiums.</p>
    );
  return (
    <div
      className="osc-creation-class-description vm-flavor"
      dangerouslySetInnerHTML={{ __html: loaded.detail.description }}
    />
  );
}

export function Facts({ facts }: { facts: [string, ReactNode][] }) {
  return (
    <dl className="u-grid tw:grid-cols-[max-content_minmax(0,1fr)] u-gap-x-4 u-gap-y-2 u-items-baseline">
      {facts.map(([label, value]) => (
        <div key={label} className="tw:contents">
          <dt className="vm-key">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
