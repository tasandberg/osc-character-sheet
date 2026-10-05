import "./wizard.scss";
import { SectionTitle } from "@ui/SectionTitle";

type Props = {
  actor?: { name: string };
};

export default function CreationWizardApp({ actor }: Props) {
  return (
    <div className="osc-sheet-app u-items-center u-justify-center u-p-6">
      <main className="u-stack u-items-center">
        <SectionTitle>
          {actor ? `Create ${actor.name}` : "New Character"}
        </SectionTitle>
        <p className="u-fs-sm u-text-dim">Character creation is on its way.</p>
      </main>
    </div>
  );
}
