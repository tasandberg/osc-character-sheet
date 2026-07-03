import { cx } from "./cx";

type Tab<T extends string> = { id: T; label: string; count?: number };
type Props<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  onSelect: (id: T) => void;
  className?: string;
};

/** @category Navigation */
export function Tabs<T extends string>({ tabs, active, onSelect, className }: Props<T>) {
  return (
    <div className={cx("tabs", className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === active}
          className={cx("tab", t.id === active && "active")}
          onClick={() => onSelect(t.id)}
        >
          {t.label}
          {t.count != null && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
