import {
  InlineButton,
  OverrideValue,
  ValidatedInput,
} from "@src/OscSheet/components/ui";
import type { OSEActor } from "@src/OscSheet/domain/types";
import type { CSSProperties } from "react";

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
  style,
}: {
  actor: OSEActor;
  hdVal: string;
  hdDefault: string | null | undefined;
  hdOverridden: boolean;
  onCommit: (v: string) => void;
  onResetRequest: () => void;
  style: CSSProperties;
}) {
  const rollHd = () => {
    const speaker = ChatMessage.getSpeaker({ actor });
    void new Roll(hdVal).toMessage(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { speaker, flavor: `Hit Dice — ${hdVal}` } as any,
    );
  };

  return (
    <div className="ed-field" style={style}>
      <span className="lab">Hit Dice</span>
      <InlineButton
        className="ed-rollbtn"
        title={`Roll ${hdVal} hit points`}
        onClick={rollHd}
      >
        <i className="fa-solid fa-dice-d20" aria-hidden="true" />
      </InlineButton>
      <ValidatedInput
        className="input mono"
        value={hdVal}
        validate={validateHd}
        onCommit={onCommit}
        spellCheck={false}
        hint={
          hdDefault != null ? (
            <OverrideValue
              overridden={hdOverridden}
              defaultText={`default · ${hdDefault}`}
              onResetRequest={onResetRequest}
            />
          ) : undefined
        }
      />
    </div>
  );
}
