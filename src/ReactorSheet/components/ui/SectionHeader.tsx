import type { ReactNode } from "react";
import { SectionTitle } from "./SectionTitle";

/** Section title row with an optional right-aligned control (add/edit button).
 *  Shared by the Abilities + Languages sections (the `.section-header` layout). */
export function SectionHeader({ title, controls }: { title: string; controls?: ReactNode }) {
  return (
    <div className="section-header">
      <SectionTitle>{title}</SectionTitle>
      {controls}
    </div>
  );
}
