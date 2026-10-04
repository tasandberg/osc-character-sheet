import type { ReactNode, Ref } from "react";
import { cx } from "./cx";

export function BulletParagraph({
  lead,
  bullet = "▶",
  clamp,
  className,
  ref,
  children,
}: {
  lead?: ReactNode;
  bullet?: ReactNode;
  clamp?: number;
  className?: string;
  ref?: Ref<HTMLDivElement>;
  children?: ReactNode;
}) {
  return (
    <div
      ref={ref}
      className={cx("bullet-paragraph", clamp && "is-clamped", className)}
      style={clamp ? { WebkitLineClamp: clamp } : undefined}
    >
      <span
        aria-hidden={typeof bullet === "string" || undefined}
        className="bullet-paragraph-bullet"
      >
        {bullet}
      </span>
      {lead}
      {lead != null && " "}
      {children}
    </div>
  );
}
