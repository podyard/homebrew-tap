# This file is generated from the single source of truth in
# packages/config/src/podyard.ts (see scripts/generate-brew-formula.ts).
# Do not edit the values below by hand — edit the config and regenerate.
class Podyard < Formula
  desc "Millisecond sandboxes for AI agents (CLI)"
  homepage "https://podyard.dev"
  version "0.1.0"
  license "MIT"

  # The CLI ships as a single npm package. We fetch its published tarball and
  # install it with the system npm. The url, version and sha256 are stamped in
  # by scripts/generate-brew-formula.ts from the npm registry at release time,
  # so each Homebrew bump always points at a real, verifiable artifact.
  url "https://registry.npmjs.org/podyard/-/podyard-0.1.0.tgz"
  sha256 "REPLACE_ME"

  depends_on "node"

  def install
    # Unpack the tarball into the build dir, install its runtime deps, and link
    # the `podyard` entry point onto PATH.
    (buildpath / "cli").mkpath
    Tar.extract_tarball stage, "./package", into: buildpath / "cli"
    system "npm", "--prefix", buildpath / "cli", "install", "--omit=dev", "--no-audit", "--no-fund"
    bin.install_symlink buildpath / "cli" / "package" / "dist" / "index.js" => "podyard"
  end

  test do
    system "#{bin}/podyard", "--version"
  end
end
