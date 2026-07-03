// Deliberately empty. Storybook's vite builder otherwise auto-loads the root
// vite.config.ts, whose foundry-vtt-react plugin proxies module requests to the
// Foundry server (:30000) and breaks `storybook dev` (preview 404s/spinner).
// Everything Storybook needs is added in main.ts `viteFinal`.
export default {};
