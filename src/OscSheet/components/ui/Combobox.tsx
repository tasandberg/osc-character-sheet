import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "./cx";
import { filterOptions, labelForValue, shouldShowCreate, type ComboOption } from "./comboboxFilter";

export type { ComboOption };

export type ComboboxProps = {
  value: string;
  options: ComboOption[];
  onCommit: (value: string) => void;
  allowCreate?: boolean;
  /** Label for the create row given the typed query. Default: `Create "x"`. */
  newOptionLabel?: (query: string) => ReactNode;
  /** Leading non-interactive prompt shown before typing when creation is allowed. Defaults to a
   *  generic prompt; pass custom copy to tailor it, or `null` to hide it. */
  createHint?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const defaultNewOptionLabel = (q: string) => `Create “${q}”`;

/**
 * Create-or-select combobox: an editable text input over a filterable option
 * list. Selecting an option commits its `value`; when `allowCreate`, a novel
 * typed label commits verbatim (trimmed). Custom values not in `options` show
 * their raw text. Blur/Escape revert to the committed value — creation is
 * explicit via Enter or click only.
 * @category Controls
 */
export function Combobox({
  value,
  options,
  onCommit,
  allowCreate = true,
  newOptionLabel = defaultNewOptionLabel,
  createHint = "Type to add…",
  placeholder,
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const filtered = useMemo(() => (dirty ? filterOptions(options, query) : options), [dirty, options, query]);
  const showCreate = dirty && shouldShowCreate(options, query, allowCreate);
  const total = filtered.length + (showCreate ? 1 : 0);
  const createIndex = showCreate ? filtered.length : -1;

  useEffect(() => {
    if (open && !dirty) {
      const i = filtered.findIndex((o) => o.value === value);
      setHighlight(i >= 0 ? i : 0);
    } else {
      setHighlight(0);
    }
  }, [open, dirty, query, value, filtered]);

  const displayText = open && dirty ? query : labelForValue(options, value);
  const rowId = (i: number) => `${listId}-opt-${i}`;
  const activeId = open && total > 0 ? rowId(highlight) : undefined;

  useEffect(() => {
    const el = activeId ? document.getElementById(activeId) : null;
    try { el?.scrollIntoView({ block: "nearest" }); } catch { /* jsdom: no layout engine */ }
  }, [activeId]);

  const reset = () => {
    setOpen(false);
    setDirty(false);
    setQuery("");
  };

  const commitAt = (i: number) => {
    if (i === createIndex) {
      onCommit(query.trim());
    } else if (i >= 0 && i < filtered.length) {
      onCommit(filtered[i].value);
    } else {
      reset();
      return;
    }
    reset();
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (total > 0) setHighlight((h) => (h + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open && total > 0) setHighlight((h) => (h - 1 + total) % total);
    } else if (e.key === "Enter") {
      if (open && total > 0) {
        e.preventDefault();
        commitAt(highlight);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        reset();
      }
    }
  };

  return (
    <div className={cx("combobox", open && "is-open", dirty && "is-typing", className)}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        className="input combobox-input"
        value={displayText}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => !disabled && setOpen(true)}
        onMouseDown={(e) => {
          if (disabled || document.activeElement !== inputRef.current) return;
          if (open && !dirty) {
            e.preventDefault();
            reset();
          } else {
            setOpen(true);
          }
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setDirty(true);
          setOpen(true);
        }}
        onBlur={reset}
        onKeyDown={onKeyDown}
      />
      <span className="combobox-caret" aria-hidden="true">
        <i className="fa-solid fa-chevron-down" />
      </span>
      {open && (
        <div className="combobox-pop" id={listId} role="listbox">
          {createHint && allowCreate && !dirty && (
            <div className="combobox-opt combobox-hint" aria-disabled onMouseDown={(e) => e.preventDefault()}>
              <span className="combobox-create-plus">+</span> {createHint}
            </div>
          )}
          {filtered.map((o, i) => (
            <div
              key={o.value}
              id={rowId(i)}
              role="option"
              aria-selected={i === highlight}
              className={cx("combobox-opt", i === highlight && "is-highlighted")}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => commitAt(i)}
            >
              {o.node ?? o.label}
            </div>
          ))}
          {showCreate && (
            <div
              id={rowId(createIndex)}
              role="option"
              aria-selected={highlight === createIndex}
              className={cx("combobox-opt", "combobox-create", highlight === createIndex && "is-highlighted")}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlight(createIndex)}
              onClick={() => commitAt(createIndex)}
            >
              <span className="combobox-create-plus">+</span> {newOptionLabel(query.trim())}
            </div>
          )}
          {total === 0 && (
            <div className="combobox-empty" aria-disabled>
              {allowCreate ? "Type to add…" : "No matches"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
