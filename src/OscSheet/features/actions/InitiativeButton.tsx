import { formatMod } from "@domain/format";
import { IconButton } from "@ui/IconButton";

type Props = {
  mod: number;
  onRoll?: () => void;
};

export function InitiativeButton({ mod, onRoll }: Props) {
  return (
    <IconButton
      variant="raised"
      className="osc-roll-button osc-icon-tone-brass"
      disabled={!onRoll}
      onClick={onRoll}
      title="Roll initiative"
      aria-label={`Roll initiative ${formatMod(mod)}`}
    >
      <i className="fa-solid fa-dice-d6" aria-hidden="true" />
      <span>Initiative</span>
      <span className="tw:font-mono">{formatMod(mod)}</span>
    </IconButton>
  );
}
