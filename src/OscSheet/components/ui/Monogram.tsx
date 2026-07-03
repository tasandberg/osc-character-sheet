import type { DragEventHandler } from "react";

/** Ink-stamp icon box: the subject's art, or a letter-monogram fallback. The box
 *  styling (size, border, radius, colour) lives on the caller's `className` — this
 *  only owns the image-or-letter branch shared across weapon/feature icons. Pass
 *  `imgClassName` for an <img>-only modifier (e.g. an object-fit helper); drag /
 *  test-id props are forwarded to whichever element renders. */
export function Monogram({
  img,
  monogram,
  className,
  imgClassName,
  ...rest
}: {
  img?: string | null;
  monogram: string;
  className: string;
  imgClassName?: string;
  draggable?: boolean;
  onDragStart?: DragEventHandler<HTMLElement>;
  "data-testid"?: string;
}) {
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
