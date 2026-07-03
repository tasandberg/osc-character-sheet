import type { Preview, Decorator } from "@storybook/react-vite";
// SAME import order as the app + Ladle: fonts → tokens → components → sheet base.
// Vite applies postcss.config.mjs (Vellum scoper) to the vellum/* files.
import "../src/ReactorSheet/styles/vellum/fonts.css";
import "../src/ReactorSheet/styles/vellum/tokens.css";
import "../src/ReactorSheet/styles/vellum/utilities.css";
import "../src/ReactorSheet/styles/vellum/components.css";
import "../src/ReactorSheet/styles/styles.scss";

const withSheet: Decorator = (Story, ctx) => {
  const cream = ctx.globals.theme === "cream";
  return (
    <div className="reactor-sheet" data-theme={cream ? "cream" : undefined}>
      {/* resize handle: drag-test the container-query reflow, as in Ladle */}
      <div
        className="reactor-sheet-app"
        style={{
          resize: "horizontal",
          overflow: "auto",
          width: 640,
          maxWidth: "100%",
          padding: 16,
        }}
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
  },
  parameters: {
    layout: "fullscreen", // we own the outer padding via .reactor-sheet-app
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};
export default preview;
