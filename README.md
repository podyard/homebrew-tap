# podyard-tap

Homebrew tap for the [podyard](https://podyard.dev) CLI.

## Install

```bash
brew tap podyard/homebrew-tap
brew install podyard
```

## How it works

The `Formula/podyard.rb` is generated from the published npm package
`@podyard/cli` (see `scripts/generate-brew-formula.ts`). After each CLI release,
the formula is regenerated with the new version, URL, and SHA-256 checksum,
then committed to `main`. This ensures `brew upgrade podyard` always points
at a real, verifiable artifact.

## Regenerating the formula

```bash
pnpm install
pnpm run generate              # latest published version
pnpm run generate 0.2.0        # specific version
```
