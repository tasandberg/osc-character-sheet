import type { DragEventHandler } from "react";
import type { OscIconName } from "@old-school-chronicle/vellum/icons";
import { OscIcon } from "@old-school-chronicle/vellum/icons/react";

/** Ink-stamp icon box: the subject's OSC icon, its art, or a letter-monogram fallback. The box
 *  styling (size, border, radius, colour) lives on the caller's `className` — this
 *  only owns the image-or-letter branch shared across weapon/feature icons. Pass
 *  `imgClassName` for an <img>-only modifier (e.g. an object-fit helper); drag /
 *  test-id props are forwarded to whichever element renders. */
export function Monogram({
  icon,
  img,
  monogram,
  className,
  imgClassName,
  ...rest
}: {
  icon?: OscIconName | null;
  img?: string | null;
  monogram: string;
  className: string;
  imgClassName?: string;
  draggable?: boolean;
  onDragStart?: DragEventHandler<HTMLElement>;
  "data-testid"?: string;
}) {
  if (icon) {
    return (
      <span className={className} aria-hidden="true" {...rest}>
        <OscIcon
          name={icon}
          className="tw:block tw:size-[1.6em] tw:[&>svg]:size-full"
        />
      </span>
    );
  }
  return img ? (
    <img
      className={imgClassName ? `${className} ${imgClassName}` : className}
      src={img}
      alt=""
      aria-hidden="true"
      {...rest}
    />
  ) : (
    <span className={className} aria-hidden="true" {...rest}>
      {monogram}
    </span>
  );
}
