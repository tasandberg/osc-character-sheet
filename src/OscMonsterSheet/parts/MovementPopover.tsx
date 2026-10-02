import { useId, useRef, type KeyboardEvent } from "react";
import { Field, Input } from "@ui/Field";
import { Popover } from "@ui/Popover";

type Props = {
  anchor: DOMRect;
  base: string;
  details: string;
  onCommit: (patch: Record<string, unknown>) => void;
  onClose: () => void;
};

export function MovementPopover({
  anchor,
  base,
  details,
  onCommit,
  onClose,
}: Props) {
  const id = useId();
  const draft = useRef({ base, details });

  const save = () => {
    const patch: Record<string, unknown> = {};
    const nextBase = draft.current.base.trim();
    if (
      nextBase !== base &&
      nextBase !== "" &&
      Number.isFinite(Number(nextBase))
    )
      patch["system.movement.base"] = Number(nextBase);
    const nextDetails = draft.current.details.trim();
    if (nextDetails !== details) patch["system.details.movement"] = nextDetails;
    if (Object.keys(patch).length) onCommit(patch);
  };

  const close = (commit: boolean) => {
    if (commit) save();
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close(false);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      close(true);
    }
  };

  const field = (
    key: "base" | "details",
    label: string,
    placeholder?: string,
    autoFocus?: boolean,
  ) => (
    <Field variant="hairline" label={label} htmlFor={`${id}-${key}`}>
      <Input
        id={`${id}-${key}`}
        variant="hairline"
        aria-label={label}
        autoFocus={autoFocus}
        defaultValue={draft.current[key]}
        placeholder={placeholder}
        onChange={(event) => {
          draft.current[key] = event.currentTarget.value;
        }}
      />
    </Field>
  );

  return (
    <Popover
      anchor={anchor}
      placement="bottom-end"
      label="Edit movement"
      inset="u-stack u-gap-2 u-px-3 u-py-2"
      className="tw:w-[calc(var(--spacer-12)*5)]"
      onClose={() => close(true)}
      onKeyDown={onKeyDown}
    >
      {field("base", "Base rate", undefined, true)}
      {field("details", "Details", "e.g. 360′ (120′) flying")}
    </Popover>
  );
}
