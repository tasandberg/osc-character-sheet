import { cx } from "@ui/cx";
import type { TabItem } from "@layout/types";

type Props = { tabs: TabItem[]; active: string; onSelect: (id: string) => void };

/** Horizontal bottom nav bar; shown only at XS (app ≤ 479c), where it replaces the rail. */
export function BottomBar({ tabs, active, onSelect }: Props) {
  return (
    <nav
      data-testid="bottom-bar"
      className="tw:hidden tw:@max-md/app:flex tw:@max-md/app:flex-none tw:@max-md/app:border-t tw:@max-md/app:border-border tw:@max-md/app:bg-bg-2"
      aria-label="Sheet sections"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === active}
          aria-controls="osc-tabpanel"
          className={cx("osc-botbtn", t.id === active && "active")}
          onClick={() => onSelect(t.id)}
        >
          {t.icon && <span className="osc-botbtn-ic" aria-hidden="true">{t.icon}</span>}
          <span className="osc-botbtn-lbl">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
