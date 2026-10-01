import { cx } from "@ui/cx";
import { InlineEdit } from "./InlineEdit";

const MAX_BOXES = 6;

type Props = {
  name: string;
  value: number;
  max: number;
  onSet?: (value: number) => void;
};

export function UsesTally({ name, value, max, onSet }: Props) {
  if (max > MAX_BOXES) {
    return (
      <span className="osc-monster-value u-fs-xs">
        <InlineEdit
          label={`${name} uses left`}
          value={String(value)}
          onCommit={
            onSet &&
            ((next) => {
              const n = Number.parseInt(next, 10);
              if (Number.isFinite(n)) onSet(Math.min(n, max));
            })
          }
        />
        /{max}
      </span>
    );
  }

  const boxes = Array.from({ length: max }, (_, index) => index < value);
  return (
    <span
      className="osc-monster-tally u-inline-flex"
      role="group"
      aria-label={`${name}: ${value} of ${max} uses left`}
    >
      {boxes.map((filled, index) => {
        return onSet ? (
          <button
            key={index}
            type="button"
            className={cx("osc-monster-tally-box", filled && "is-filled")}
            aria-label={`${name} use ${index + 1}`}
            aria-pressed={filled}
            onClick={() => onSet(filled ? index : index + 1)}
          />
        ) : (
          <span
            key={index}
            className={cx("osc-monster-tally-box", filled && "is-filled")}
          />
        );
      })}
    </span>
  );
}
