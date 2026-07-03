import { cx } from "@ui/cx";
import type { TabItem } from "@layout/types";

type Props = { tabs: TabItem[]; active: string; onSelect: (id: string) => void };

/** Horizontal tab bar (wide layout; shown ≥800c via .osc-htabs). */
export function TabBar({ tabs, active, onSelect }: Props) {
  return (
    <div className="osc-htabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          data-testid={`tab-${t.id.replace(/^page-/, "")}`}
          aria-selected={t.id === active}
          aria-controls="osc-tabpanel"
          className={cx("osc-htab", t.id === active && "active")}
          onClick={() => onSelect(t.id)}
        >
          {t.icon && <span className="osc-htab-ic">{t.icon}</span>}
          {t.label}
          {t.count != null && <span className="osc-htab-ct">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
