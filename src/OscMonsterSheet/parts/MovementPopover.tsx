import { useLayoutEffect, useRef, type KeyboardEvent } from "react";
import { computePosition, flip, shift } from "@floating-ui/dom";
import { useDismiss } from "@ui/useDismiss";

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
  const ref = useRef<HTMLDivElement>(null);
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

  useDismiss(ref, () => close(true));

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reference = { getBoundingClientRect: () => anchor };
    void computePosition(reference, element, {
      strategy: "fixed",
      placement: "bottom-end",
      middleware: [flip(), shift({ padding: 8 })],
    }).then(({ x, y }) =>
      Object.assign(element.style, { left: `${x}px`, top: `${y + 6}px` }),
    );
    element.querySelector("input")?.focus();
  }, [anchor]);

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
  ) => (
    <label className="osc-monster-popover-field">
      <span className="osc-monster-label">{label}</span>
      <input
        aria-label={label}
        className="osc-monster-popover-input u-fs-xs"
        defaultValue={draft.current[key]}
        placeholder={placeholder}
        onChange={(event) => {
          draft.current[key] = event.currentTarget.value;
        }}
      />
    </label>
  );

  return (
    <div
      ref={ref}
      className="osc-monster-popover"
      role="dialog"
      aria-label="Edit movement"
      onKeyDown={onKeyDown}
    >
      <div className="osc-monster-popover-inner u-px-3 u-py-2">
        {field("base", "Base rate")}
        {field("details", "Details", "e.g. 360′ (120′) flying")}
      </div>
    </div>
  );
}
