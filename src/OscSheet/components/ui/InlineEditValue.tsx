import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { cx } from "./cx";

type Base = {
  label: string;
  value: string;
  placeholder?: string;
  className?: string;
};

type Props = Base &
  (
    | { parse?: "text"; onCommit?: (next: string) => void }
    | { parse: "int"; onCommit?: (next: number) => void }
  );

function selectContents(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export function InlineEditValue(props: Props) {
  const { label, value, placeholder, className } = props;
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

  if (!props.onCommit) return <span className={className}>{display}</span>;

  const commit = (next: string) => {
    if (props.parse !== "int") return props.onCommit?.(next);
    const n = Number.parseInt(next, 10);
    if (Number.isFinite(n)) props.onCommit?.(n);
  };

  const finish = () => {
    const typed = (ref.current?.textContent ?? "").trim();
    const next = !value && typed === placeholder ? "" : typed;
    setEditing(false);
    setRevision((n) => n + 1);
    if (!cancelled.current && next !== value) commit(next);
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
        "inline-edit",
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
