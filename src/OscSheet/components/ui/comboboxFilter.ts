import type { ReactNode } from "react";

/** `label` drives filtering + the input's display text; optional `node` overrides how the row renders. */
export type ComboOption = { value: string; label: string; node?: ReactNode };

/** Options whose label case-insensitively contains the (trimmed) query. */
export function filterOptions(options: ComboOption[], query: string): ComboOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => o.label.toLowerCase().includes(q));
}

/** A Create row shows only when creation is allowed and the query is a novel, non-empty label. */
export function shouldShowCreate(options: ComboOption[], query: string, allowCreate = true): boolean {
  if (!allowCreate) return false;
  const q = query.trim();
  if (!q) return false;
  return !options.some((o) => o.label.toLowerCase() === q.toLowerCase());
}

export function labelForValue(options: ComboOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
