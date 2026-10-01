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
      <span className="u-fs-xs u-nowrap">
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
        const target = index + 1 === value ? index : index + 1;
        return onSet ? (
          <button
            key={index}
            type="button"
            className={cx("osc-monster-tally-box", filled && "is-filled")}
            aria-label={`Set ${name} uses left to ${target}`}
            onClick={() => onSet(target)}
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
