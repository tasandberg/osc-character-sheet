// Lazy-loaded shim over @sentry/browser. crashReporter dynamically imports
// THIS module (never the SDK barrel directly): a dynamic namespace import of
// "@sentry/browser" would defeat tree-shaking and drag Replay/Tracing into the
// chunk. Static named re-exports here let rollup shake the SDK down to the
// manual-client minimum, while vite still code-splits it (0 KB until consent).
export {
  BrowserClient,
  Scope,
  dedupeIntegration,
  defaultStackParser,
  makeFetchTransport,
} from "@sentry/browser";
