import type { ReactNode } from "react";
import { cx } from "./cx";
import { Stamp } from "./Stamp";
import { rollable } from "./rollable";

/** An "ink-stamp key · big value · caption" stat cell, optionally wired to a
 *  roll. Shared by the ability plaques (`.rs-abil`) and the saves grid
 *  (`.fvtt-save`). Class-preserving: the wrapper/value/caption/stamp classes are
 *  passed through so the existing per-context SCSS keeps applying; the `.plaque`
 *  base only carries what both call sites already share (see components.css).
 *  When `onActivate` is set the cell becomes a keyboard-accessible button and
 *  gains the `rollable` class. */
export function StatPlaque({
  stampKey,
  value,
  caption,
  onActivate,
  className,
  valueClassName,
  captionClassName,
  stampClassName,
  title,
  "data-testid": dataTestid,
}: {
  stampKey: ReactNode;
  value: ReactNode;
  caption?: ReactNode;
  onActivate?: () => void;
  /** wrapper class (e.g. "rs-abil" | "fvtt-save") */
  className?: string;
  valueClassName?: string;
  captionClassName?: string;
  stampClassName?: string;
  title?: string;
  "data-testid"?: string;
}) {
  return (
    <div
      className={cx("plaque", className, onActivate && "rollable")}
      title={title}
      data-testid={dataTestid}
      {...rollable(onActivate)}
    >
      <Stamp className={stampClassName}>{stampKey}</Stamp>
      <div className={valueClassName}>{value}</div>
      {caption != null && <div className={captionClassName}>{caption}</div>}
    </div>
  );
}
