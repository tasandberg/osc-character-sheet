// Push a release to the Foundry package registry
// (https://foundryvtt.com/article/package-release-api/) so the public
// listing updates. Reads id/version/compatibility from the stamped
// module.json (run tools/package.mjs first). The registry wants a
// VERSION-PINNED manifest URL, so it's built from the tag
// (releases/download/<tag>/module.json) — NOT module.json's stable
// `manifest` field, which floats with releases/latest.
//
// Usage: FOUNDRY_RELEASE_TOKEN=… node tools/publish-registry.mjs <tag> [--dry-run]
//   --dry-run — registry validates the payload without saving (precheck).
//
// Re-run semantics: re-POSTing an already-released version returns 400
// unique_together; treated as success so workflow re-runs are idempotent.
// Any other non-2xx exits 1 — the release job must go red on rejection.

import { readFileSync } from "fs";

const API =
  process.env.FOUNDRY_API_URL ?? "https://foundryvtt.com/_api/packages/release_version/";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const tag = args.find((a) => a !== "--dry-run");
if (!tag) {
  console.error("Usage: node tools/publish-registry.mjs <tag> [--dry-run]");
  process.exit(1);
}
const token = process.env.FOUNDRY_RELEASE_TOKEN;
if (!token) {
  console.error("FOUNDRY_RELEASE_TOKEN is not set");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync("./module.json", "utf8"));
const body = {
  id: manifest.id,
  ...(dryRun && { "dry-run": true }),
  release: {
    version: manifest.version,
    manifest: `${manifest.url}/releases/download/${tag}/module.json`,
    notes: `${manifest.url}/releases/tag/${tag}`,
    compatibility: manifest.compatibility,
  },
};

console.log(
  `${dryRun ? "Dry-run" : "Publishing"} ${body.id} ${body.release.version} → ${body.release.manifest}`,
);
const res = await fetch(API, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: token },
  body: JSON.stringify(body),
});
const text = await res.text();

if (res.ok) {
  console.log(`Registry ${dryRun ? "dry-run" : "publish"} OK: ${text}`);
} else if (res.status === 400 && text.includes("unique_together")) {
  console.log(`Version ${body.release.version} already on the registry — nothing to do.`);
} else {
  console.error(`Registry ${dryRun ? "dry-run" : "publish"} failed (${res.status}): ${text}`);
  process.exit(1);
}
