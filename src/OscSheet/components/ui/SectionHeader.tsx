import type { ReactNode } from "react";
import { SectionTitle } from "./SectionTitle";

/** Section title row with an optional right-aligned control (add/edit button).
 *  Shared by the Abilities + Languages sections (the `.section-header` layout). */
export function SectionHeader({
  title,
  hint,
  controls,
}: {
  title: string;
  hint?: ReactNode;
  controls?: ReactNode;
}) {
  return (
    <div className="section-header">
      <SectionTitle hint={hint}>{title}</SectionTitle>
      {controls}
    </div>
  );
}
