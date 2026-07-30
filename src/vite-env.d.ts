/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />

// Build-time-injected module id (vite `define`); beta builds override it.
declare const __MODULE_ID__: string;
/** Branch + sha the build came from; "" in CI. */
declare const __BUILD_STAMP__: string;
