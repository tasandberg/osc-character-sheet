import fontsCss from "./fonts.css?raw";

export const SHEET_FONT_FAMILIES = new Set(
  Array.from(
    fontsCss.matchAll(/font-family:\s*["']?([^"';]+?)["']?\s*;/g),
    ([, family]) => family,
  ),
);

const unquote = (family: string) => family.replace(/^["']|["']$/g, "");

export function preloadSheetFonts(fonts: FontFaceSet = document.fonts) {
  fonts.forEach((face) => {
    if (SHEET_FONT_FAMILIES.has(unquote(face.family))) {
      face.load().catch(() => {});
    }
  });
}
