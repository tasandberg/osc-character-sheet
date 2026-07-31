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
      {/* Always dark: --ink and the stamp-* text tokens are constant across
          themes, so the bar reads identically in dark and cream. Padding is a
          touch deeper below the bar than above it. */}
      <div className="osc-topbar tw:border-b tw:border-border tw:bg-ink tw:px-2 tw:pt-1 tw:pb-2">
        {topbar ?? <Placeholder label="Topbar" hint="Lv · XP · Rest · Level Up · Edit · Theme (P4a)" />}
      </div>
      <div className="osc-body tw:relative tw:flex tw:min-h-0 tw:flex-1 tw:bg-bg">
        <div className="osc-sheet-body">
          {minibar}
          <div className="osc-pad">
            <div className="osc-twopane">
              <div className="osc-left">
                {header ?? <Placeholder label="Header" hint="portrait · name · class · alignment · vitals (P4b)" />}
                {/* hidden in the collapsed left column; relocates into the expanded rail */}
                <div className="osc-rail-extra tw:hidden tw:@twopane/sheet:mt-3 tw:@twopane/sheet:block">
                  {railExtra ?? <Placeholder label="Saves & Skills" hint="D/W/P/B/S · exploration — expanded rail (P4d)" />}
                </div>
              </div>
              <div className="osc-right tw:min-w-0">
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
