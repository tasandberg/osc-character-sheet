import type { ReactNode } from "react";
import { SectionTitle } from "./SectionTitle";

/** Section title row with an optional right-aligned control (add/edit button).
 *  Shared by the Abilities + Languages sections (the `.rs-feat-head` layout). */
export function SectionHeader({ title, controls }: { title: string; controls?: ReactNode }) {
  return (
    <div className="rs-feat-head">
      <SectionTitle>{title}</SectionTitle>
      {controls}
    </div>
  );
}
