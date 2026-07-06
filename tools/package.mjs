// Stamp module.json for a release and zip the module artifacts.
// Single source for the packaged file list + release-URL conventions — used
// by CI (.github/workflows/release.yml) and the local release script.
//
// Usage: node tools/package.mjs <version> [tag]
//   version — semver stamped into module.json (no leading v)
//   tag     — the git/release tag the download URL points at (defaults to
//             version; this repo tags bare versions, but a v-prefixed tag
//             still yields a working URL)
//
// URL conventions (Foundry auto-update):
//   manifest → releases/latest/download/module.json — a STABLE url; GitHub's
//              "latest" is the newest non-prerelease, non-draft release, so
//              prereleases never become what updaters resolve.
//   download → releases/download/<tag>/module.zip — pinned to THIS release.

import { execSync } from "child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const [version, tagArg] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version ?? "")) {
  console.error("Usage: node tools/package.mjs <semver-version> [tag]");
  process.exit(1);
}
const tag = tagArg || version;

const manifest = JSON.parse(readFileSync("./module.json", "utf8"));
manifest.version = version;
manifest.manifest = `${manifest.url}/releases/latest/download/module.json`;
manifest.download = `${manifest.url}/releases/download/${tag}/module.zip`;
writeFileSync("./module.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`Stamped module.json ${version} (download → ${manifest.download})`);

// Source maps stay out of the zip — release CI uploads them to Sentry instead.
// Strip vite's sourceMappingURL comments too: a pointer to a map that isn't
// shipped makes DevTools log fetch failures on users' machines.
for (const file of readdirSync("dist", { recursive: true })) {
  if (!file.endsWith(".js")) continue;
  const path = join("dist", file);
  const src = readFileSync(path, "utf8");
  const stripped = src.replace(/^\/\/# sourceMappingURL=.*\n?/gm, "");
  if (stripped !== src) writeFileSync(path, stripped);
}

mkdirSync("build", { recursive: true });
// Always zip from scratch — `zip -r` updates in place, so a stale archive
// would keep entries for files that no longer exist (renamed dist chunks).
rmSync("build/module.zip", { force: true });
execSync('zip -r build/module.zip module.json dist/ lang/ templates/ README.md -x "*.map"', {
  stdio: "inherit",
});
