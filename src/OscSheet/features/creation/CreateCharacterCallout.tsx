import { Button } from "@ui/Button";
import { openCreationWizard } from "@src/CreationWizard/opener";
import type { OSEActor } from "@domain/types";

export function CreateCharacterCallout({ actor }: { actor: OSEActor }) {
  return (
    <div className="u-row u-justify-between u-wrap u-gap-3 u-p-3 u-mb-3 u-r-md u-border-brass u-bg-surface">
      <p className="u-fs-sm u-text-dim">This character is blank.</p>
      <Button
        variant="primary"
        size="sm"
        onClick={() => openCreationWizard(actor)}
      >
        Create character
      </Button>
    </div>
  );
}
