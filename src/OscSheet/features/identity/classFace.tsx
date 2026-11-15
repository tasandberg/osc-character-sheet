import type { ReactNode } from "react";
import { Tag } from "@ui/Tag";
import { classSource } from "@domain/classRules";

const SOURCE_TAG = {
  advanced: ["ADV", "teal", "Advanced Fantasy"],
  classic: ["SRD", "brass", "Classic Fantasy SRD"],
  custom: ["CUS", "mustard", "Custom"],
} as const;

export function classFace(name: string): ReactNode {
  const [text, intent, title] = SOURCE_TAG[classSource(name)];
  return (
    <>
      <span className="combobox-optlabel">{name.replace(/-/g, " ")}</span>
      <Tag intent={intent} size="xs" title={title}>
        {text}
      </Tag>
    </>
  );
}
