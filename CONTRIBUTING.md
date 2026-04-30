# Contributing to setup-acton

Thanks for contributing to `setup-acton`.

This repository contains a GitHub Action that installs [Acton](https://github.com/ton-blockchain/acton) in GitHub
Actions workflows.
The action is written in TypeScript, bundled into `dist/index.js`, and executed by GitHub Actions from the bundled file
declared in `action.yml`.

## Development Setup

Install dependencies with Bun:

```bash
bun ci
```

Run the full local check suite:

```bash
bun run all
```

Useful individual commands:

```bash
bun run lint
bun run test
bun run package
```

`dist/index.js` is committed on purpose. If you change `src/**`, run `bun run package` and include the generated
`dist/index.js` update.

## Project Layout

- `src/setup-acton.ts`: action entrypoint
- `src/artifact/`: target platform, architecture, and artifact naming
- `src/download/`: release asset download and checksum verification
- `src/version/`: Acton version resolution and installed version detection
- `__tests__/`: Vitest unit tests
- `.github/workflows/`: CI, security, typing, and release workflows

## Pull Requests

Before opening a pull request, run:

```bash
bun run all
```

For behavior changes, add or update tests. For user-facing changes, update `README.md`, `action.yml`, and
`action-types.yml` where relevant.

Commit messages should be concise and use an imperative summary, for example:

```text
fix(platform): reject unsupported windows runners
```

## Release Assets and Checksums

The action downloads Acton release assets from `ton-blockchain/acton`. Downloads are verified with SHA-256 checksums.

`src/download/known-checksums.ts` is generated. Refresh it with:

```bash
bun run checksums:update
```

Do not edit the generated checksum list manually.
