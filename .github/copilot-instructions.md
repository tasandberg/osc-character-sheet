# Copilot Instructions for Old-School Chronicle Character Sheet

## Project Overview

- **Old-School Chronicle Character Sheet** is a React-based character sheet module for Foundry VTT, integrating with the Foundry system via ES modules and custom UI components.
- The codebase is split between `src/` (React app, UI logic) and `foundry/` (Foundry VTT integration, backend logic, data models).
- The build system uses Vite and TypeScript, with custom aliases for imports (`@src/*`, `@client/*`, `@common/*`).

## Key Directories & Files

- `src/ReactorSheet/`: Main React sheet implementation. Components, styles, and types are organized here.
- `foundry/client/` and `foundry/common/`: Foundry VTT integration, game logic, and shared utilities.
- `module.json`: Foundry manifest, entry points, and compatibility info.
- `vite.config.ts`: Vite build config, including proxy for local Foundry server and custom base path.
- `package.json`: Scripts for build, dev, lint, and Foundry symlink setup.

## Build & Development

- **Start dev server:** `pnpm dev` (or `npm run dev`) — launches Vite on port 30001, proxies to Foundry server on 30000.
- **Build for production:** `pnpm build` — outputs to `dist/`.
- **Lint:** `pnpm lint` — uses ESLint with TypeScript and React rules.
- **Link to Foundry:** `pnpm link-foundry` — runs `tools/create-symlinks.mjs` to link build output to Foundry install.

## Patterns & Conventions

- **Component Structure:** React components are function-based, styled with `styled-components` and SCSS modules.
- **TypeScript:** Used for type safety in both React and Foundry integration code. Types for Foundry are provided via `fvtt-types`.
- **Import Aliases:** Use `@src/` for React code, `@client/` and `@common/` for Foundry code.
- **Hot Reload:** Enabled for CSS, HTML, HBS, JSON, MJS, JS, TS, TSX (see `module.json` flags).
- **Language Support:** English only, defined in `lang/en.json`.

## Integration Points

- **Entry Points:** Main React app is in `src/_main.js`, bundled as `dist/main.js` for Foundry.
- **Foundry Hooks:** Foundry-specific logic lives in `foundry/client/hooks.mjs` and related files.
- **Templates:** Handlebars templates in `templates/` for Foundry UI integration.

## Examples

- To add a new React component: place it in `src/ReactorSheet/components/`, use `styled-components` for styles, and import via `@src/ReactorSheet/components/...`.
- To extend Foundry logic: add modules in `foundry/client/` or `foundry/common/`, using ES modules and TypeScript where possible.

## Troubleshooting

- If UI changes don't appear, ensure symlinks are set up (`pnpm link-foundry`) and the Foundry server is running.
- For type errors, check `fvtt-types` and import paths.
- For build issues, verify Vite config and module entry points.

---

_If any section is unclear or missing, please provide feedback to improve these instructions._
