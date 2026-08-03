import { useOscSheetContext } from "@app/context";
import { selectFeatures } from "@features/abilities/features";
import { SectionHeader } from "@ui/SectionHeader";
import { IconButton } from "@ui/IconButton";
import { createAbility } from "@features/abilities/createAbility";
import { FeatureCard } from "@features/abilities/FeatureCard";
import { LanguagesSection } from "@features/abilities/LanguagesSection";
import { FLAVOUR } from "@features/abilities/classes";

export default function Abilities() {
  const { actor, canEdit } = useOscSheetContext();
  const features = selectFeatures(actor);

  // New abilities seed their requirements from the actor's class so they sort in
  // with the rest; the create flow opens the sheet to fill in the details.
  const onAdd = () => createAbility(actor, actor.system.details.class || "");

  return (
    <div className="osc-abilities-tab">
      <section className="osc-section">
        <SectionHeader
          title="Abilities"
          controls={
            canEdit ? (
              <IconButton
                variant="accent"
                title="Add ability"
                aria-label="Add ability"
                onClick={onAdd}
              >
                <i className="fas fa-plus" aria-hidden="true" />
              </IconButton>
            ) : undefined
          }
        />
        {features.length === 0 ? (
          <p className={FLAVOUR}>No abilities yet.</p>
        ) : (
          <div className="fvtt-feats tw:flex tw:flex-col tw:gap-2">
            {features.map((f) => (
              <FeatureCard key={f.id} feature={f} />
            ))}
          </div>
        )}
      </section>
      <LanguagesSection />
    </div>
  );
}
