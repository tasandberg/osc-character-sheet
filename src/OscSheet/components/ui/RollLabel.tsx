import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { cx } from "./cx";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  children: ReactNode;
  onRoll?: (event: MouseEvent<HTMLButtonElement>) => void;
  glyph?: boolean;
};

export function RollLabel({
  children,
  onRoll,
  className,
  glyph = true,
  type = "button",
  ...rest
}: Props) {
  if (!onRoll) return <span className={className}>{children}</span>;
  return (
    <button
      type={type}
      className={cx("roll-label", className)}
      onClick={onRoll}
      {...rest}
    >
      {children}
      {glyph && (
        <>
          {"\u00a0"}
          <i
            className="fa-solid fa-dice-d20 roll-label-die"
            aria-hidden="true"
          />
        </>
      )}
    </button>
  );
}
