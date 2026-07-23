import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cx } from "./cx";
import {
  filterOptions,
  labelForValue,
  shouldShowCreate,
  type ComboOption,
} from "./comboboxFilter";

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
  /** Renders the committed value as a chip overlay while at rest (not typing); the raw input is
   *  revealed on edit. Receives the raw `value`; omit for plain input text. */
  renderValue?: (value: string) => ReactNode;
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
  renderValue,
  placeholder,
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // The listbox is portaled out of the control's scroll/stacking context so it
  // can't be clipped by an overflow ancestor (e.g. a modal body) or sink behind
  // a sibling. Anchored via fixed positioning to the control's viewport rect.
  const [popRect, setPopRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const portalTarget = () =>
    wrapRef.current?.closest<HTMLElement>(".modal-scrim") ??
    wrapRef.current?.closest<HTMLElement>(".osc-sheet-app") ??
    (typeof document !== "undefined" ? document.body : null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = wrapRef.current?.getBoundingClientRect();
      if (r) setPopRect({ top: r.bottom, left: r.left, width: r.width });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  const filtered = useMemo(
    () => (dirty ? filterOptions(options, query) : options),
    [dirty, options, query],
  );
  const showCreate = dirty && shouldShowCreate(options, query, allowCreate);
  // The Create row sits at the top (index 0); options follow, offset by one.
  const createIndex = showCreate ? 0 : -1;
  const optOffset = showCreate ? 1 : 0;
  const total = filtered.length + optOffset;

  useEffect(() => {
    if (open && !dirty) {
      const i = filtered.findIndex((o) => o.value === value);
      setHighlight(i >= 0 ? i : 0);
    } else {
      setHighlight(0);
    }
  }, [open, dirty, query, value, filtered]);

  const displayText = open && dirty ? query : labelForValue(options, value);
  const showChip = !!renderValue && !open && value !== "";
  const rowId = (i: number) => `${listId}-opt-${i}`;
  const activeId = open && total > 0 ? rowId(highlight) : undefined;

  useEffect(() => {
    const el = activeId ? document.getElementById(activeId) : null;
    try {
      el?.scrollIntoView({ block: "nearest" });
    } catch {
      /* jsdom: no layout engine */
    }
  }, [activeId]);

  const reset = () => {
    setOpen(false);
    setDirty(false);
    setQuery("");
  };

  const commitAt = (i: number) => {
    const fi = i - optOffset;
    if (i === createIndex) {
      onCommit(query.trim());
    } else if (fi >= 0 && fi < filtered.length) {
      onCommit(filtered[fi].value);
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

  const target = open ? portalTarget() : null;

  return (
    <div
      ref={wrapRef}
      className={cx(
        "combobox",
        open && "is-open",
        dirty && "is-typing",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        className={cx("input combobox-input", showChip && "is-chip")}
        value={displayText}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
          const el = inputRef.current;
          requestAnimationFrame(() => el?.select());
        }}
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
      {showChip && (
        <span className="combobox-chip" aria-hidden="true">
          {renderValue!(value)}
        </span>
      )}
      <span className="combobox-caret" aria-hidden="true">
        <i className="fa-solid fa-chevron-down" />
      </span>
      {open &&
        popRect &&
        target &&
        createPortal(
          <div
            className="combobox-pop"
            id={listId}
            role="listbox"
            style={{
              position: "fixed",
              top: `${popRect.top}px`,
              left: `${popRect.left}px`,
              width: `${popRect.width}px`,
              right: "auto",
            }}
          >
            {createHint && allowCreate && !dirty && (
            <div
              className="combobox-opt combobox-hint"
              aria-disabled
              onMouseDown={(e) => e.preventDefault()}
            >
              <span className="combobox-create-plus">+</span> {createHint}
            </div>
          )}
          {showCreate && (
            <div
              id={rowId(createIndex)}
              role="option"
              aria-selected={highlight === createIndex}
              className={cx(
                "combobox-opt",
                "combobox-create",
                highlight === createIndex && "is-highlighted",
              )}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                commitAt(createIndex);
              }}
              onMouseEnter={() => setHighlight(createIndex)}
            >
              <span className="combobox-create-plus">+</span>{" "}
              {newOptionLabel(query.trim())}
            </div>
          )}
          {filtered.map((o, i) => {
            const idx = i + optOffset;
            return (
              <div
                key={o.value}
                id={rowId(idx)}
                role="option"
                aria-selected={idx === highlight}
                className={cx(
                  "combobox-opt",
                  idx === highlight && "is-highlighted",
                )}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  commitAt(idx);
                }}
                onMouseEnter={() => setHighlight(idx)}
              >
                {o.node ?? o.label}
              </div>
            );
          })}
            {total === 0 && (
              <div className="combobox-empty" aria-disabled>
                {allowCreate ? "Type to add…" : "No matches"}
              </div>
            )}
          </div>,
          target,
        )}
    </div>
  );
}
