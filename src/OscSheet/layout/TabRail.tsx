import { cx } from "@ui/cx";
import type { TabItem } from "@layout/types";

type Props = { tabs: TabItem[]; active: string; onSelect: (id: string) => void };

/** Vertical right-edge rail (narrow layout). Hidden at xs (bottom bar) and lg
 *  (horizontal tabs). No top padding — the first/active tab sits flush against
 *  the top bar; the 14px the prototype used reads as a stray block in cream. */
export function TabRail({ tabs, active, onSelect }: Props) {
  return (
    <nav
      data-testid="tab-rail"
      className="tw:flex tw:w-10 tw:flex-none tw:flex-col tw:items-stretch tw:gap-1 tw:border-l tw:border-border tw:bg-bg-2 tw:@max-md/app:hidden tw:@lg/app:hidden"
      aria-label="Sheet sections"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          className={cx("osc-tab", t.id === active && "active")}
          aria-current={t.id === active ? "page" : undefined}
          onClick={() => onSelect(t.id)}
          title={t.label}
        >
          {t.icon && <span className="osc-tab-ic">{t.icon}</span>}
          {t.label}
          {t.count != null && <span className="osc-tab-ct">{t.count}</span>}
        </button>
      ))}
    </nav>
  );
}
