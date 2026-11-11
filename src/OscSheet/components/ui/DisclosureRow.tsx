import type { MouseEventHandler, ReactNode } from "react";
import { IconButton } from "@ui/IconButton";
import { Monogram } from "@ui/Monogram";

export const DISCLOSURE_INDENT =
  "tw:pl-[calc(var(--spacer-5)+var(--spacer-2))]";

export function RowIcon({
  img,
  name,
  large,
}: {
  img?: string | null;
  name: string;
  large?: boolean;
}) {
  return (
    <Monogram
      img={img}
      monogram={(name.trim().charAt(0) || "?").toUpperCase()}
      className={`tw:grid ${large ? "tw:size-6" : "tw:size-5"} tw:flex-none tw:place-items-center tw:bg-ink tw:font-semibold u-fs-2xs tw:text-stamp-text`}
      imgClassName="tw:object-cover"
    />
  );
}

export function DisclosureRow({
  label,
  expanded,
  onToggle,
  onClick,
  className = "",
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`u-flex u-items-center u-gap-2 u-py-1 ${className}`}
      onClick={onClick}
    >
      <IconButton
        className="ft-chev tw:size-5 tw:text-(length:--fs-sm)"
        aria-expanded={expanded}
        aria-label={label}
        title={label}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
      </IconButton>
      <div className="u-flex u-items-center u-gap-2 u-flex-1 tw:min-w-0">
        {children}
      </div>
    </div>
  );
}
