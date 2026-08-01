import {
  InlineButton,
  OverrideValue,
  ValidatedInput,
} from "@src/OscSheet/components/ui";
import type { OSEActor } from "@src/OscSheet/domain/types";
import { ED_FIELD, LAB_ID } from "./classes";

// A hit-die formula must be a valid Roll AND actually contain a die term.
const validateHd = (v: string) =>
  /d\d/i.test(v) && Roll.validate(v) ? null : "invalid dice formula";

export function HitDiceField({
  actor,
  hdVal,
  hdDefault,
  hdOverridden,
  onCommit,
  onResetRequest,
  className,
}: {
  actor: OSEActor;
  hdVal: string;
  hdDefault: string | null | undefined;
  hdOverridden: boolean;
  onCommit: (v: string) => void;
  onResetRequest: () => void;
  /** Grid placement in the caller's identity grid (see edit/classes.ts). */
  className?: string;
}) {
  const rollHd = () => {
    const speaker = ChatMessage.getSpeaker({ actor });
    void new Roll(hdVal).toMessage(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { speaker, flavor: `Hit Dice — ${hdVal}` } as any,
    );
  };

  return (
    <div className={`${ED_FIELD} ${className ?? ""}`}>
      <span className={LAB_ID}>Hit Dice</span>
      {/* Corner placement + d20 sizing — the InlineButton primitive owns only
          the look; where it sits is this consumer's job. */}
      <InlineButton
        className="ed-rollbtn tw:absolute tw:top-[-2px] tw:right-0 tw:w-[18px] tw:h-[18px] tw:leading-[0] tw:z-3"
        title={`Roll ${hdVal} hit points`}
        onClick={rollHd}
      >
        <i
          className="fa-solid fa-dice-d20 tw:text-[length:var(--fs-md)]"
          aria-hidden="true"
        />
      </InlineButton>
      <ValidatedInput
        className="input mono"
        value={hdVal}
        validate={validateHd}
        onCommit={onCommit}
        spellCheck={false}
        hint={
          hdDefault && hdDefault !== hdVal ? (
            <OverrideValue
              overridden={hdOverridden}
              defaultText={`${hdDefault}`}
              onResetRequest={onResetRequest}
            />
          ) : undefined
        }
      />
    </div>
  );
}
