import type { ReactNode } from "react";
import { TabRail } from "@layout/TabRail";
import { TabBar } from "@layout/TabBar";
import { BottomBar } from "@layout/BottomBar";
import type { TabItem } from "@layout/types";

type Nav = {
  tabs: TabItem[];
  active: string;
  onSelect: (id: string) => void;
};

type Props = {
  /** Active tab body — rendered in the right pane. */
  children: ReactNode;
  /** Omitted on sheets with a single fixed body: rail, tab bar and bottom bar all drop out. */
  nav?: Nav;
  /** Optional layout slots; each region is omitted when its slot is absent. */
  topbar?: ReactNode;
  header?: ReactNode;
  railExtra?: ReactNode;
  /** Pinned bar inside the sheet scroller (medium layout, collapsed header). */
  minibar?: ReactNode;
};

/**
 * Presentational app frame. Layout regions are slots; the right pane mounts the
 * active tab body. Responsive reflow lives in shell.scss.
 */
export function Frame({ nav, children, topbar, header, railExtra, minibar }: Props) {
  return (
    <>
      {/* Always dark: --ink and the stamp-* text tokens are constant across
          themes, so the bar reads identically in dark and cream. Padding is a
          touch deeper below the bar than above it. */}
      {topbar && (
        <div className="osc-topbar tw:border-b tw:border-border tw:bg-ink tw:px-2 tw:pt-1 tw:pb-2">
          {topbar}
        </div>
      )}
      <div className="osc-body tw:relative tw:flex tw:min-h-0 tw:flex-1 tw:bg-bg">
        <div className="osc-sheet-body">
          {minibar}
          <div className="osc-pad">
            <div className="osc-twopane">
              <div className="osc-left">
                {header}
                {/* hidden in the collapsed left column; relocates into the expanded rail */}
                {railExtra && (
                  <div className="osc-rail-extra tw:hidden tw:@twopane/sheet:mt-3 tw:@twopane/sheet:block">
                    {railExtra}
                  </div>
                )}
              </div>
              <div className="osc-right tw:min-w-0">
                {nav ? (
                  <>
                    <TabBar {...nav} />
                    <div id="osc-tabpanel" role="tabpanel">
                      {children}
                    </div>
                  </>
                ) : (
                  children
                )}
              </div>
            </div>
          </div>
        </div>
        {nav && <TabRail {...nav} />}
      </div>
      {nav && <BottomBar {...nav} />}
    </>
  );
}
