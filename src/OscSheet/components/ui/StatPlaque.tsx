import type { ReactNode } from "react";
import { cx } from "./cx";
import { Stamp } from "./Stamp";
import { rollable, type ActivateEvent } from "./rollable";

/** An "ink-stamp key · big value · caption" stat cell, optionally wired to a
 *  roll. Two vellum variants (see `.plaque` in components.css):
 *    • `ability` — gold-framed plaque with a bottom mod pill.
 *    • `save` — inked surface card with a 22px stamp.
 *  Sub-elements are styled by the variant via generic `.pk`/`.pv`/`.pc` classes.
 *  When `onActivate` is set the cell becomes a keyboard-accessible button and
 *  gains the `rollable` class. */
export function StatPlaque({
  variant,
  stampKey,
  value,
  caption,
  onActivate,
  className,
  title,
  "data-testid": dataTestid,
}: {
  variant: "ability" | "save";
  stampKey: ReactNode;
  value: ReactNode;
  caption?: ReactNode;
  onActivate?: (event: ActivateEvent) => void;
  className?: string;
  title?: string;
  "data-testid"?: string;
}) {
  return (
    <div
      className={cx("plaque", `plaque-${variant}`, onActivate && "rollable", className)}
      title={title}
      data-testid={dataTestid}
      {...rollable(onActivate)}
    >
      <Stamp className="pk">{stampKey}</Stamp>
      <div className="pv">{value}</div>
      {caption != null && <div className="pc">{caption}</div>}
    </div>
  );
}
