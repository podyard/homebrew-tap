![Podyard](banner.jpg)

# Podyard Homebrew Tap

Homebrew tap for the [Podyard CLI](https://podyard.dev) — millisecond sandboxes
for AI agents.

## Install

```bash
brew tap podyard/homebrew-tap
brew install podyard
```

Verify:

```bash
podyard --version
```

Upgrade whenever a new CLI release is published:

```bash
brew update
brew upgrade podyard
```

## Repository layout

```
Formula/podyard.rb                  generated Homebrew formula
scripts/generate-brew-formula.ts    formula generator (npm registry -> .rb)
.github/workflows/ci.yml            validates the formula on every push/PR
.github/workflows/regenerate.yml    re-stamps the formula after each CLI release
```

## How it works

The `Formula/podyard.rb` is generated from the published npm package
`@podyard/cli` (see `scripts/generate-brew-formula.ts`). After each CLI release,
the formula is regenerated with the new version, URL, and SHA-256 checksum,
then committed to `main`. This ensures `brew upgrade podyard` always points
at a real, verifiable artifact.

At install time the formula:

1. Downloads the exact published npm tarball (pinned by URL + SHA-256).
2. Installs its runtime dependencies with `npm install --omit=dev`.
3. Writes a `podyard` shell wrapper in the Homebrew `bin` directory that execs
   the CLI entrypoint with `node`.

## Regenerating the formula

```bash
pnpm install
pnpm run generate              # latest published version
pnpm run generate 0.2.0        # specific version
```

## Local testing

```bash
brew install --build-from-source podyard/homebrew-tap/podyard
podyard --version
```

## Development

- Tooling runs on **Node 22** (see `.nvmrc`) with **pnpm**.
- CI (`brew style` / `brew audit`) runs on every push and pull request.
- See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions and how to add more
  formulas.

## License

[Apache License 2.0](LICENSE) — the same license as the `@podyard/cli`
package.
