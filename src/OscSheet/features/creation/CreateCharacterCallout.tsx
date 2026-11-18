import { Button } from "@ui/Button";
import { InlineButton } from "@ui/InlineButton";
import { FLAGS, readFlag, setFlag } from "@domain/flags";
import { openCreationWizard } from "@src/CreationWizard/opener";
import type { OSEActor } from "@domain/types";

export function CreateCharacterCallout({ actor }: { actor: OSEActor }) {
  if (readFlag(actor, FLAGS.creationPromptDismissed)) return null;
  return (
    <section
      aria-label="Character creation"
      className="osc-warnings-strip u-row u-wrap u-gap-3 u-px-4 u-py-2"
    >
      <p className="u-flex-1 u-fs-sm u-text tw:m-0 tw:font-sans tw:leading-snug">
        This character is blank.
      </p>
      <InlineButton
        variant="link"
        size="sm"
        onClick={() => void setFlag(actor, FLAGS.creationPromptDismissed, true)}
      >
        Dismiss
      </InlineButton>
      <Button
        variant="primary"
        size="sm"
        onClick={() => openCreationWizard(actor)}
      >
        Create character
      </Button>
    </section>
  );
}
