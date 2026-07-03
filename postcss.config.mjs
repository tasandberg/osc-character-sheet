import { scopeVellum } from "./tools/postcss/scope-vellum.mjs";

// Vite resolves this once and applies to every CSS file. scopeVellum no-ops on
// any file not under styles/vellum/, so SCSS output (already namespaced under
// .osc-sheet) is never double-prefixed.
export default { plugins: [scopeVellum] };
