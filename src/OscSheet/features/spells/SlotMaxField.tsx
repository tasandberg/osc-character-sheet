import { useOscSheetContext } from "@app/context";
import { NumberInput } from "@ui/NumberInput";
import { OverrideValue } from "@ui/OverrideValue";
import { slotMaxPath } from "@features/spells/spells";

const FIELD =
  "osc-slotmax tw:w-[3.5ch] tw:cursor-text tw:rounded-sm tw:border tw:border-border tw:bg-bg-2 tw:px-[2px] tw:py-0 tw:text-center tw:font-mono tw:text-[length:var(--fs-xs)] tw:text-text tw:outline-none tw:focus:border-teal";

type Props = {
  level: number;
  max: number;
  defaultMax: number | null;
  overridden: boolean;
};

/**
 * A spell level's slot maximum. Shows the class+level rulebook default until the
 * user types over it, which stores an override — custom classes and house rules
 * have no table to derive from. Read-only sheets get the plain number.
 */
export function SlotMaxField({ level, max, defaultMax, overridden }: Props) {
  const { canEdit, updateActor } = useOscSheetContext();
  if (!canEdit) return <>{max}</>;

  const setMax = (n: number) => void updateActor({ [slotMaxPath(level)]: n });

  return (
    <>
      <NumberInput
        className={FIELD}
        value={max}
        min={0}
        max={99}
        onCommit={setMax}
        aria-label={`Level ${level} slot maximum`}
        title="Slots at this level — edit for a custom class or house rule"
      />
      {overridden && defaultMax != null && (
        <OverrideValue
          overridden
          className="tw:self-center"
          defaultText={`default · ${defaultMax}`}
          onResetRequest={() => setMax(defaultMax)}
        />
      )}
    </>
  );
}
