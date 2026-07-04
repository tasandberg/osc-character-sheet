// Lazy-loaded shim over @sentry/browser. crashReporter dynamically imports
// THIS module (never the SDK barrel directly): a dynamic namespace import of
// "@sentry/browser" would defeat tree-shaking and drag Replay/Tracing into the
// chunk. Static named re-exports here let rollup shake the SDK down to the
// manual-client minimum, while vite still code-splits it (0 KB until the user
// presses "Send bug report").
export {
  BrowserClient,
  Scope,
  defaultStackParser,
  makeFetchTransport,
} from "@sentry/browser";
