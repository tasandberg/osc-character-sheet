import moduleManifest from "../module.json" with { type: "json" };
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const { version: currentVersion, url: githubRepository } = moduleManifest;

function getArguments() {
  const releaseType = args.find(arg => arg.startsWith('--type='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');
  if (!releaseType) {
    console.error('Usage: node release.mjs --type=<major|minor|patch>');
    process.exit(1);
  }
  if (!['major', 'minor', 'patch'].includes(releaseType)) {
    console.error('Release type must be major, minor, or patch');
    process.exit(1);
  }
  return {
    releaseType,
    dryRun
  };
}

function getNewVersion(currentVersion, releaseType) {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  // Increment version based on type
  let newVersion;
  switch (releaseType) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }
  return newVersion;
}

// Stamp module.json + build the zip — shared with CI (tools/package.mjs is
// the single source for the file list and manifest/download URL conventions).
function stampAndArchive(newVersion) {
  console.log(`Packaging ${newVersion} (was ${currentVersion})`);
  if (dryRun) return;
  execSync(`node tools/package.mjs ${newVersion}`, { stdio: 'inherit' });
}

function abortIfGitDirty() {
  const status = execSync('git status --porcelain').toString().trim();
  if (status) {
    console.error('Error: Git working directory is dirty. Please commit or stash changes before releasing.');
    process.exit(1);
  }
}

function buildDist() {
  console.log('Building distribution files...');
  if (dryRun) return;
  execSync('pnpm build', { stdio: 'inherit' });
}

function commitRelease(newVersion) {
  const message = `Release ${newVersion}`
  console.log(`Committing changes: "${message}"`)
  if (dryRun) return
  execSync(`git add -A && git commit -m "${message}"`, { stdio: 'inherit' });
}

// Check if GitHub CLI is available
function ensureGithubCLI() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('Error: GitHub CLI (gh) is not installed or not available in PATH');
    console.error('Please install GitHub CLI: https://cli.github.com/');
    process.exit(1);
  }
}

function createGithubRelease(tag) {
  const cmd = `git push \
    && gh release create ${tag} --title "${tag}" --generate-notes build/module.zip module.json \
    && git fetch --tags origin`;
  console.log(`Creating GitHub release with command: ${cmd}`);
  if (dryRun) return;
  execSync(cmd, { stdio: 'inherit' });
}
  
// Parse release type from arguments
const { releaseType, dryRun } = getArguments();
const newVersion = getNewVersion(moduleManifest.version, releaseType)

abortIfGitDirty()
ensureGithubCLI()
buildDist()
stampAndArchive(newVersion)
commitRelease(newVersion)
// CI (release.yml) re-builds on "release published" and re-attaches the
// canonical assets with --clobber; the upload here just avoids an asset gap.
createGithubRelease(newVersion)

if (dryRun) {
  console.log('Dry run mode - no changes will be made.');
  process.exit(0);
}
