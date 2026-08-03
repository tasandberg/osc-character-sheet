import type { Preview, Decorator } from "@storybook/react-vite";
// FIRST — several feature modules touch game/CONFIG/foundry at module scope, so
// the stubs have to exist before any story module is evaluated.
import "./foundry-stub";
import { FONT_SCALE_FACTOR, resolveFontScale } from "../src/OscSheet/fontScale";
// SAME import order as the app: fonts → tokens → components → sheet base →
// Tailwind. Vite applies postcss.config.mjs (Vellum scoper) to the vellum/* files.
import "../src/OscSheet/styles/vellum/fonts.css";
import "@old-school-chronicle/vellum/tokens.css";
import "../src/OscSheet/styles/vellum/sheet-base.scss";
import "../src/OscSheet/styles/vellum/utilities.scss";
import "../src/OscSheet/styles/vellum/components.css";
import "../src/OscSheet/styles/styles.scss";
// LAST, exactly as in index.tsx — the utilities are unlayered, so source order is
// what keeps them above our own stylesheets. Storybook's own vite config must
// carry the tailwindcss() plugin or this import is inert (see main.ts).
import "../src/OscSheet/styles/vellum/tailwind.css";

const withSheet: Decorator = (Story, ctx) => {
  const cream = ctx.globals.theme === "cream";
  // Without this, every story renders at 1× and a defect that only appears at
  // compact/large is invisible here — the same blind spot the tabs had.
  const scale = FONT_SCALE_FACTOR[resolveFontScale(ctx.globals.fontScale)];
  return (
    <div className="osc-sheet" data-theme={cream ? "cream" : undefined}>
      {/* resize handle: drag-test the container-query reflow, as in Ladle */}
      <div
        className="osc-sheet-app"
        style={{
          resize: "horizontal",
          overflow: "auto",
          width: 640,
          maxWidth: "100%",
          padding: 16,
          ...(scale === 1 ? {} : { "--fs-scale": String(scale) }),
        } as React.CSSProperties}
      >
        <Story />
      </div>
    </div>
  );
};

const preview: Preview = {
  decorators: [withSheet],
  globalTypes: {
    theme: {
      description: "Vellum theme",
      defaultValue: "default",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "default", title: "Default (dark)" },
          { value: "cream", title: "Cream" },
        ],
        dynamicTitle: true,
      },
    },
    fontScale: {
      description: "Sheet font scale (--fs-scale)",
      defaultValue: "medium",
      toolbar: {
        title: "Font",
        icon: "zoom",
        items: [
          { value: "compact", title: "Compact (0.875×)" },
          { value: "medium", title: "Medium (1×)" },
          { value: "large", title: "Large (1.125×)" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "fullscreen", // we own the outer padding via .osc-sheet-app
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: {
      // Foundations on top, then primitives by kind, app shell, features last.
      storySort: {
        method: "alphabetical",
        order: [
          "Foundations",
          ["Design System", "Utilities"],
          "Controls",
          "Display",
          "Overlays",
          "Layout",
          "Navigation",
          "Data",
          "Shell",
          "*",
        ],
      },
    },
  },
};
export default preview;
