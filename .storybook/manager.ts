import { addons } from "storybook/manager-api";

// Collapse every group by default so the sidebar reads as a table of contents;
// roots are the lowercased group slugs from the story titles.
addons.setConfig({
  sidebar: {
    collapsedRoots: [
      "controls",
      "display",
      "overlays",
      "layout",
      "navigation",
      "data",
      "chrome",
      "shell",
      "actions",
      "inventory",
    ],
  },
});
