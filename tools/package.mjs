// Stamp module.json for a release and zip the module artifacts.
// Single source for the packaged file list + release-URL conventions — used
// by CI (.github/workflows/release.yml) and the local release script.
//
// Usage: node tools/package.mjs <version> [tag] [--beta]
//   version — semver stamped into module.json (no leading v)
//   tag     — the git/release tag the download URL points at (defaults to
//             version; this repo tags bare versions, but a v-prefixed tag
//             still yields a working URL)
//   --beta  — stamp the BETA-channel variant (see below). Off by default; the
//             default stable stamping is byte-for-byte unchanged.
//
// URL conventions (Foundry auto-update):
//   Default (stable):
//     manifest → releases/latest/download/module.json — a STABLE url; GitHub's
//                "latest" is the newest non-prerelease, non-draft release, so
//                prereleases never become what updaters resolve.
//     download → releases/download/<tag>/module.zip — pinned to THIS release.
//   --beta (rolling beta channel, OLD-42):
//     manifest → releases/download/beta/module.json — SELF-REFERENTIAL, points
//                at the fixed `beta` tag whose assets CI re-clobbers on every
//                published release, so a beta install keeps polling beta (not
//                latest) and rides every build, prereleases included.
//     download → releases/download/beta/module.zip — the rolling beta zip.
//   version is the plain X.Y.Z from the tag in both modes (no -beta labels;
//   Foundry's isNewerVersion mishandles prerelease labels).

import { execSync } from "child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";

const args = process.argv.slice(2);
const beta = args.includes("--beta");
const [version, tagArg] = args.filter((a) => a !== "--beta");
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version ?? "")) {
  console.error("Usage: node tools/package.mjs <semver-version> [tag] [--beta]");
  process.exit(1);
}
const tag = tagArg || version;

const manifest = JSON.parse(readFileSync("./module.json", "utf8"));
manifest.version = version;
if (beta) {
  manifest.title = `${manifest.title} [Beta]`;
  manifest.manifest = `${manifest.url}/releases/download/beta/module.json`;
  manifest.download = `${manifest.url}/releases/download/beta/module.zip`;
} else {
  manifest.manifest = `${manifest.url}/releases/latest/download/module.json`;
  manifest.download = `${manifest.url}/releases/download/${tag}/module.zip`;
}
writeFileSync("./module.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `Stamped module.json ${version}${beta ? " [beta]" : ""} (download → ${manifest.download})`,
);

// Maps live in Sentry, not the zip — strip the refs so DevTools doesn't chase 404s.
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
