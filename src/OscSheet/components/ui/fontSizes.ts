export const FONT_SIZE_CLASSES = {
  "4xs": "tw:text-(length:--fs-4xs)",
  "3xs": "tw:text-(length:--fs-3xs)",
  "2xs": "tw:text-(length:--fs-2xs)",
  xs: "tw:text-(length:--fs-xs)",
  sm: "tw:text-(length:--fs-sm)",
  md: "tw:text-(length:--fs-md)",
  base: "tw:text-(length:--fs-base)",
  lg: "tw:text-(length:--fs-lg)",
  xl: "tw:text-(length:--fs-xl)",
  "2xl": "tw:text-(length:--fs-2xl)",
  "3xl": "tw:text-(length:--fs-3xl)",
  "4xl": "tw:text-(length:--fs-4xl)",
  "5xl": "tw:text-(length:--fs-5xl)",
  "6xl": "tw:text-(length:--fs-6xl)",
  "7xl": "tw:text-(length:--fs-7xl)",
  "8xl": "tw:text-(length:--fs-8xl)",
} as const;

export type FontSize = keyof typeof FONT_SIZE_CLASSES;
export const FONT_SIZES = Object.keys(FONT_SIZE_CLASSES) as FontSize[];
