import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cx } from "@ui/cx";

type Props = {
  label: string;
  value: string;
  onCommit?: (next: string) => void;
  placeholder?: string;
  className?: string;
};

function selectContents(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function InlineEdit({
  label,
  value,
  onCommit,
  placeholder,
  className,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [revision, setRevision] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const cancelled = useRef(false);
  const display = value || placeholder;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!editing || !element) return;
    element.focus();
    selectContents(element);
  }, [editing]);

  if (!onCommit) return <span className={className}>{display}</span>;

  const finish = () => {
    const typed = (ref.current?.textContent ?? "").trim();
    const next = !value && typed === placeholder ? "" : typed;
    setEditing(false);
    setRevision((n) => n + 1);
    if (!cancelled.current && next !== value) onCommit(next);
    cancelled.current = false;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (!editing) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setEditing(true);
      }
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      event.stopPropagation();
      cancelled.current = true;
      event.currentTarget.blur();
    }
  };

  return (
    <span
      key={revision}
      ref={ref}
      role={editing ? "textbox" : "button"}
      tabIndex={0}
      aria-label={editing ? label : `Edit ${label}`}
      contentEditable={editing ? "plaintext-only" : undefined}
      suppressContentEditableWarning
      spellCheck={false}
      className={cx(
        "osc-monster-editable",
        editing && "is-editing",
        !value && "is-empty",
        className,
      )}
      onClick={editing ? undefined : () => setEditing(true)}
      onBlur={editing ? finish : undefined}
      onKeyDown={onKeyDown}
    >
      {display}
    </span>
  );
}
