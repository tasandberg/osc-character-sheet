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
  children: ReactNode;
  /** Absent → no rail, tab bar or bottom bar. */
  nav?: Nav;
  topbar?: ReactNode;
  header?: ReactNode;
  railExtra?: ReactNode;
  minibar?: ReactNode;
};

export function Frame({ nav, children, topbar, header, railExtra, minibar }: Props) {
  return (
    <>
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
