import { cx } from "./cx";

type Props = {
  sides: 4 | 6 | 8 | 20;
  value: number;
  verdict?: "crit" | "fumble";
  rolling?: boolean;
  className?: string;
};

/** @category Display */
export function Die({ sides, value, verdict, rolling, className }: Props) {
  return (
    <div className={cx("die", `d${sides}`, verdict, rolling && "rolling", className)}>
      <span className="face">{value}</span>
    </div>
  );
}
