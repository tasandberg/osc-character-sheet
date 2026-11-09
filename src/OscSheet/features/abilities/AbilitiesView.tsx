import { useOscSheetContext } from "@app/context";
import { selectFeatures } from "@features/abilities/features";
import { SectionHeader } from "@ui/SectionHeader";
import { IconButton } from "@ui/IconButton";
import { createAbility } from "@features/abilities/createAbility";
import { FeatureCard } from "@features/abilities/FeatureCard";
import { LanguagesSection } from "@features/abilities/LanguagesSection";
import { FLAVOUR } from "@features/abilities/classes";
import { IdentitySection } from "@features/identity/IdentitySection";
import { ProgressionToggle } from "@features/abilities/ClassProgressionTable";
import { classTable } from "@features/abilities/classProgression";
import {
  grantingItems,
  groupAbilities,
  itemKey,
  useGrantLinks,
  type GrantingItem,
} from "@features/abilities/grantedAbilities";
import type { FeatureVM } from "@features/abilities/features";
import type { ReactNode } from "react";
import type { OseClassItem } from "@domain/types";

function FeatureList({ features }: { features: FeatureVM[] }) {
  if (features.length === 0)
    return <p className={FLAVOUR}>No abilities yet.</p>;
  return (
    <div className="tw:flex tw:flex-col">
      {features.map((f) => (
        <FeatureCard key={f.id} feature={f} />
      ))}
    </div>
  );
}

function AbilitySection({
  title,
  hint,
  controls,
  children,
}: {
  title: string;
  hint?: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="osc-section" aria-label={title}>
      <SectionHeader title={title} hint={hint} controls={controls} />
      {children}
    </section>
  );
}

function GrantingSection({
  item,
  features,
}: {
  item: GrantingItem;
  features: FeatureVM[];
}) {
  const table = item.type === "class" ? classTable(item as OseClassItem) : null;
  return (
    <AbilitySection
      title={item.name}
      hint={item.type === "race" ? "Race" : undefined}
    >
      {table && <ProgressionToggle table={table} />}
      <FeatureList features={features} />
    </AbilitySection>
  );
}

export default function Abilities() {
  const { actor, canEdit } = useOscSheetContext();
  const features = selectFeatures(actor);

  // New abilities seed their requirements from the actor's class so they sort in
  // with the rest; the create flow opens the sheet to fill in the details.
  const onAdd = () => createAbility(actor, actor.system.details.class || "");

  const links = useGrantLinks(actor);
  const items = grantingItems(actor);
  const { byItem, ungranted } = groupAbilities(actor, links);
  const pick = (ids: string[] = []) =>
    features.filter((f) => ids.includes(f.id));
  const addButton = canEdit ? (
    <IconButton
      variant="accent"
      title="Add ability"
      aria-label="Add ability"
      onClick={onAdd}
    >
      <i className="fas fa-plus" aria-hidden="true" />
    </IconButton>
  ) : undefined;

  return (
    <div data-testid="abilities-tab">
      <IdentitySection />
      {items.map((item) => (
        <GrantingSection
          key={itemKey(item)}
          item={item}
          features={pick(byItem[itemKey(item)])}
        />
      ))}
      <AbilitySection
        title={items.length ? "Other abilities" : "Abilities"}
        controls={addButton}
      >
        <FeatureList features={items.length ? pick(ungranted) : features} />
      </AbilitySection>
      <LanguagesSection />
    </div>
  );
}
