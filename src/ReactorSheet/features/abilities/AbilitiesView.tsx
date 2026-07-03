import { useReactorSheetContext } from "@app/context";
import { selectFeatures } from "@features/abilities/features";
import { SectionHeader } from "@ui/SectionHeader";
import { IconButton } from "@ui/IconButton";
import { createAbility } from "@features/abilities/createAbility";
import { FeatureCard } from "@features/abilities/FeatureCard";
import { LanguagesSection } from "@features/abilities/LanguagesSection";

export default function Abilities() {
  const { actor } = useReactorSheetContext();
  const features = selectFeatures(actor);

  // New abilities seed their requirements from the actor's class so they sort in
  // with the rest; the create flow opens the sheet to fill in the details.
  const onAdd = () => createAbility(actor, actor.system.details.class || "");

  return (
    <div className="rs-abilities-tab">
      <section className="rs-section rs-feat-sec">
        <SectionHeader
          title="Abilities"
          controls={
            <IconButton
              variant="accent"
              title="Add ability"
              aria-label="Add ability"
              onClick={onAdd}
            >
              <i className="fas fa-plus" aria-hidden="true" />
            </IconButton>
          }
        />
        {features.length === 0 ? (
          <p className="rs-flavour">No abilities yet.</p>
        ) : (
          <div className="fvtt-feats">
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
