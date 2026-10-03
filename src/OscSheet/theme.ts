export const THEMES = ["dark", "cream"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_SETTINGS = ["system", ...THEMES] as const;
export type ThemeSetting = (typeof THEME_SETTINGS)[number];

export function resolveThemeSetting(value: unknown): ThemeSetting {
  return value === "dark" || value === "cream" ? value : "system";
}

export function foundryColorScheme(): Theme {
  return globalThis.document?.body?.classList.contains("theme-light")
    ? "cream"
    : "dark";
}

export function effectiveTheme(
  setting: ThemeSetting,
  scheme: Theme = foundryColorScheme(),
): Theme {
  return setting === "system" ? scheme : setting;
}

export function watchFoundryColorScheme(onChange: () => void): () => void {
  let current = foundryColorScheme();
  const observer = new MutationObserver(() => {
    const next = foundryColorScheme();
    if (next === current) return;
    current = next;
    onChange();
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

/** Apply a theme to a sheet's root element. Dark = no attribute (token default). */
export function applyTheme(root: HTMLElement, theme: Theme): void {
  if (theme === "dark") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}
