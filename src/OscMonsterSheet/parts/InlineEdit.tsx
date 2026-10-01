import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "@ui/cx";

type Props = {
  label: string;
  value: string;
  onCommit?: (next: string) => void;
  children?: ReactNode;
  placeholder?: string;
  className?: string;
};

export function InlineEdit({
  label,
  value,
  onCommit,
  children,
  placeholder,
  className,
}: Props) {
  const [editing, setEditing] = useState(false);
  const cancelled = useRef(false);
  const display = children ?? (value || placeholder);

  if (!onCommit) return <span className={className}>{display}</span>;

  if (editing) {
    const finish = (next: string) => {
      setEditing(false);
      if (!cancelled.current && next.trim() !== value) onCommit(next.trim());
      cancelled.current = false;
    };
    return (
      <input
        aria-label={label}
        className={cx("osc-monster-inline-input", className)}
        defaultValue={value}
        autoFocus
        size={Math.max(value.length, 2)}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={(event) => finish(event.currentTarget.value)}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            cancelled.current = true;
            event.currentTarget.blur();
          }
        }}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={`Edit ${label}`}
      className={cx("osc-monster-editable", !value && "is-empty", className)}
      onClick={() => setEditing(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setEditing(true);
        }
      }}
    >
      {display}
    </span>
  );
}
