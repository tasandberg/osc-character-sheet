import type { HTMLAttributes, Ref } from "react";
import { cx } from "./cx";

type Props = HTMLAttributes<HTMLElement> & {
  as?: "div" | "section";
  inset?: string;
  ref?: Ref<HTMLDivElement>;
};

export function RuleFrame({
  as: Tag = "div",
  inset,
  className,
  children,
  ...rest
}: Props) {
  return (
    <Tag className={cx("rule-frame", className)} {...rest}>
      <div className={cx("rule-frame-inner", inset)}>{children}</div>
    </Tag>
  );
}
