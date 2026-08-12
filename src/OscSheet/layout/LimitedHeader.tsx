import type { IdentityVM } from "@domain/vm-types";
import { Identity } from "@layout/Identity";
import { Portrait } from "@layout/Portrait";

export function LimitedHeader({ identity }: { identity: IdentityVM }) {
  return (
    <div className="osc-limited-head tw:flex tw:items-center tw:gap-4 tw:@twopane/sheet:flex-col tw:@twopane/sheet:gap-3">
      <Portrait identity={identity} />
      <Identity identity={identity} showClassLine={false} />
    </div>
  );
}
