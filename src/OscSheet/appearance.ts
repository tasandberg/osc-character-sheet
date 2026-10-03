import {
  FONT_SCALES,
  resolveFontScale,
  type FontScale,
} from "@src/OscSheet/fontScale";
import {
  effectiveTheme,
  THEME_SETTINGS,
  type Theme,
  type ThemeSetting,
} from "@src/OscSheet/theme";

export const SAME_AS_CHARACTER_SHEET = "inherit";
type Inherit = typeof SAME_AS_CHARACTER_SHEET;

export type MonsterThemeSetting = ThemeSetting | Inherit;
export type MonsterFontScaleSetting = FontScale | Inherit;

export type SheetKind = "character" | "monster";

export type AppearanceSettings = {
  readonly theme: ThemeSetting;
  readonly fontScale: FontScale;
  readonly monsterTheme: MonsterThemeSetting;
  readonly monsterFontScale: MonsterFontScaleSetting;
};

export function resolveMonsterTheme(value: unknown): MonsterThemeSetting {
  return THEME_SETTINGS.includes(value as ThemeSetting)
    ? (value as ThemeSetting)
    : SAME_AS_CHARACTER_SHEET;
}

export function resolveMonsterFontScale(
  value: unknown,
): MonsterFontScaleSetting {
  return FONT_SCALES.includes(value as FontScale)
    ? (value as FontScale)
    : SAME_AS_CHARACTER_SHEET;
}

export function sheetTheme(
  kind: SheetKind,
  settings: AppearanceSettings,
  scheme?: Theme,
): Theme {
  const own = kind === "monster" ? settings.monsterTheme : settings.theme;
  return effectiveTheme(
    own === SAME_AS_CHARACTER_SHEET ? settings.theme : own,
    scheme,
  );
}

export function sheetFontScale(
  kind: SheetKind,
  settings: AppearanceSettings,
): FontScale {
  const own =
    kind === "monster" ? settings.monsterFontScale : settings.fontScale;
  return own === SAME_AS_CHARACTER_SHEET
    ? settings.fontScale
    : resolveFontScale(own);
}
