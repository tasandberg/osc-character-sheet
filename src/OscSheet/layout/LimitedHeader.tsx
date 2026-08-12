import type { IdentityVM } from "@domain/vm-types";
import { Identity } from "@layout/Identity";
import { Portrait } from "@layout/Portrait";

/** Header band for the LIMITED-ownership sheet: portrait and name only — class,
 *  level, title and alignment stay hidden from limited viewers.
 *  No grid areas — with two children a flex row that becomes a column in the
 *  two-pane rail says the same thing as `.osc-head`'s three-tier area map.
 *
 *  The row carries the medium-tier height: the portrait is `self-stretch` with
 *  no height of its own there (in `.osc-head` it spans both grid rows), so
 *  without a definite row height it collapses to the identity line. */
export function LimitedHeader({ identity }: { identity: IdentityVM }) {
  return (
    <div className="osc-limited-head tw:flex tw:min-h-[110px] tw:items-center tw:gap-4 tw:@max-md/app:min-h-0 tw:@twopane/sheet:min-h-0 tw:@twopane/sheet:flex-col tw:@twopane/sheet:gap-3">
      <Portrait identity={identity} />
      <Identity identity={identity} showClassLine={false} />
    </div>
  );
}
