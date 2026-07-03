import { cx } from "@ui/cx";
import type { TabItem } from "@layout/types";

type Props = { tabs: TabItem[]; active: string; onSelect: (id: string) => void };

/** Horizontal bottom nav bar (XS layout; shown ≤560c via shell.scss). */
export function BottomBar({ tabs, active, onSelect }: Props) {
  return (
    <nav className="osc-bottombar" aria-label="Sheet sections">
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
