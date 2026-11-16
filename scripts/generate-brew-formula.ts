#!/usr/bin/env node
/**
 * Generates Formula/podyard.rb from the CLI's current version and its
 * published npm tarball metadata.
 *
 * Why a script instead of a hand-maintained formula?
 *   - Homebrew requires a stable `url` + `sha256` for every version bump.
 *   - The npm registry is the only authoritative source for both.
 *   - The release workflow runs this script at publish time, rewrites the
 *     formula, commits it to main (the tap), and pushes — so `brew upgrade
 *     podyard` always points at a real, checksummed artifact.
 *
 * Usage:
 *   pnpm exec tsx scripts/generate-brew-formula.ts            # latest published version
 *   pnpm exec tsx scripts/generate-brew-formula.ts 0.2.0      # specific version
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const FORMULA_PATH = join(ROOT, "Formula", "podyard.rb");

// Self-contained metadata (previously read from the private @podyard/config
// package in the podyard monorepo).
const PKG_NAME = "podyard";
const BREW_NAME = "podyard";
const DESCRIPTION = "Millisecond sandboxes for AI agents (CLI)";
const HOMEPAGE = "https://podyard.dev";
const LICENSE = "MIT";

interface NpmVersion {
  dist: { shasum: string; tarball: string };
  name: string;
  version: string;
}

const NPM_REGISTRY = "https://registry.npmjs.org";

/** Ask the npm registry for the tarball + sha1 for a package version. */
async function fetchNpmVersion(
  pkg: string,
  version: string
): Promise<NpmVersion> {
  const url = `${NPM_REGISTRY}/${pkg}/${version}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`npm registry returned ${res.status} for ${url}`);
  }
  const full = (await res.json()) as {
    "dist-tags": Record<string, string>;
    versions: Record<string, NpmVersion>;
  };

  const target = version === "latest" ? full["dist-tags"].latest : version;
  const found = full.versions[target];
  if (!found) {
    throw new Error(`Version ${target} of ${pkg} not found on the registry`);
  }
  return found;
}

function renderFormula(opts: {
  brewName: string;
  version: string;
  url: string;
  sha256: string;
}): string {
  const { brewName, version, url, sha256 } = opts;
  const classCamel = brewName.charAt(0).toUpperCase() + brewName.slice(1);
  return `# This file is generated from the single source of truth in
# packages/config/src/podyard.ts (see scripts/generate-brew-formula.ts).
# Do not edit the values below by hand — edit the config and regenerate.
class ${classCamel} < Formula
  desc "${DESCRIPTION}"
  homepage "${HOMEPAGE}"
  version "${version}"
  license "${LICENSE}"

  # The CLI ships as a single npm package. We fetch its published tarball and
  # install it with the system npm. The url, version and sha256 are stamped in
  # by scripts/generate-brew-formula.ts from the npm registry at release time,
  # so each Homebrew bump always points at a real, verifiable artifact.
  url "${url}"
  sha256 "${sha256}"

  depends_on "node"

  def install
    # Unpack the tarball into the build dir, install its runtime deps, and link
    # the \`${brewName}\` entry point onto PATH.
    (buildpath / "cli").mkpath
    Tar.extract_tarball stage, "./package", into: buildpath / "cli"
    system "npm", "--prefix", buildpath / "cli", "install", "--omit=dev", "--no-audit", "--no-fund"
    bin.install_symlink buildpath / "cli" / "package" / "dist" / "index.js" => "${brewName}"
  end

  test do
    system "#{bin}/${brewName}", "--version"
  end
end
`;
}

async function main() {
  const requested = process.argv[2] ?? "latest";

  // Resolve the version through the registry so the formula always points at a
  // real artifact. If the package (or version) is not published yet — e.g. the
  // very first release, or bumping the formula ahead of `changeset publish` —
  // fall back to the requested version with a placeholder checksum.
  // The release workflow re-runs this script after publishing, so the final
  // committed formula always has a real url + sha256.
  const registry = NPM_REGISTRY;
  let target: string;
  let url: string;
  let sha256: string;

  let resolved: NpmVersion | null = null;
  try {
    resolved = await fetchNpmVersion(PKG_NAME, requested);
    target = resolved.version;
  } catch {
    target = requested;
  }

  if (resolved && resolved.version === target) {
    url = resolved.dist.tarball;
    sha256 = resolved.dist.shasum;
  } else {
    // Not (yet) published at this exact version. Build the conventional npm
    // tarball URL; the checksum is stamped once the package is live.
    url = `${registry}/${PKG_NAME}/-/${PKG_NAME}-${target}.tgz`;
    sha256 = "REPLACE_ME";
  }

  const formula = renderFormula({
    brewName: BREW_NAME,
    version: target,
    url,
    sha256,
  });

  await writeFile(FORMULA_PATH, formula, "utf-8");
  console.log(`Wrote ${FORMULA_PATH}`);
  console.log(`  package: ${PKG_NAME}@${target}`);
  console.log(`  url:     ${url}`);
  console.log(`  sha256:  ${sha256}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
