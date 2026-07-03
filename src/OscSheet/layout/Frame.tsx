import type { ReactNode } from "react";
import { TabRail } from "@layout/TabRail";
import { TabBar } from "@layout/TabBar";
import { BottomBar } from "@layout/BottomBar";
import { Placeholder } from "@layout/Placeholder";
import type { TabItem } from "@layout/types";

type Props = {
  tabs: TabItem[];
  active: string;
  onSelect: (id: string) => void;
  /** Active tab body — rendered in the right pane. */
  children: ReactNode;
  /** Optional layout slots; each falls back to its placeholder. */
  topbar?: ReactNode;
  header?: ReactNode;
  railExtra?: ReactNode;
  /** Pinned bar inside the sheet scroller (medium layout, collapsed header). */
  minibar?: ReactNode;
};

/**
 * Presentational app frame. Layout regions are slots (placeholder fallback);
 * the right pane mounts the active tab body. Responsive reflow lives in shell.scss.
 */
export function Frame({ tabs, active, onSelect, children, topbar, header, railExtra, minibar }: Props) {
  return (
    <>
      <div className="osc-topbar">
        {topbar ?? <Placeholder label="Topbar" hint="Lv · XP · Rest · Level Up · Edit · Theme (P4a)" />}
      </div>
      <div className="osc-body">
        <div className="osc-sheet-body">
          {minibar}
          <div className="osc-pad">
            <div className="osc-twopane">
              <div className="osc-left">
                {header ?? <Placeholder label="Header" hint="portrait · name · class · alignment · vitals (P4b)" />}
                <div className="osc-rail-extra">
                  {railExtra ?? <Placeholder label="Saves & Skills" hint="D/W/P/B/S · exploration — expanded rail (P4d)" />}
                </div>
              </div>
              <div className="osc-right">
                <TabBar tabs={tabs} active={active} onSelect={onSelect} />
                <div id="osc-tabpanel" role="tabpanel">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
        <TabRail tabs={tabs} active={active} onSelect={onSelect} />
      </div>
      <BottomBar tabs={tabs} active={active} onSelect={onSelect} />
    </>
  );
}
