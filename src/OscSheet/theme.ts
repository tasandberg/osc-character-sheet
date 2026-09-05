export const THEMES = ["dark", "cream"] as const;
export type Theme = (typeof THEMES)[number];

export function resolveTheme(value: unknown): Theme {
  return value === "cream" ? "cream" : "dark";
}

/** Apply a theme to a sheet's root element. Dark = no attribute (token default). */
export function applyTheme(root: HTMLElement, theme: Theme): void {
  if (theme === "dark") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}
