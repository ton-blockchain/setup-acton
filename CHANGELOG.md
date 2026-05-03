# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.3.0] - 04.05.2026

Unreleased changes improve project-local configuration support. The action can now resolve `Acton.toml` from a caller
selected working directory, use that file as the fallback source for the requested Acton version, and cache installed
Acton toolchains between workflow runs.

### Added

- Added a `working-directory` input for resolving project-local `Acton.toml` files outside the repository root.
- Added Acton version resolution from `[toolchain].acton` in `Acton.toml` when the `version` input is omitted.
- Added caching for downloaded and extracted Acton toolchains to speed up repeated workflow runs.

## [0.2.0] - 01.05.2026

setup-acton 0.2.0 focuses on project hardening and release readiness. It adds the public project documentation,
ownership and security guidance, moves local quality checks to Biome and Vitest, narrows workflow triggers, and makes
version reporting and release lookup behavior more explicit.

### Added

- Added full project documentation for usage, outputs, supported version syntax, supported targets, recommended
  permissions, checksum verification, contributing, releasing, security, and code of conduct expectations.
- Added `CODEOWNERS` and a dedicated GitHub Actions typing workflow scoped to action metadata changes.
- Added broader unit coverage for platform, architecture, GitHub client, artifact naming, download, inputs, installed
  version parsing, and setup behavior.

### Changed

- Migrated tests from Jest to Vitest with V8 coverage, and migrated formatting and linting from ESLint/Prettier to
  Biome with stricter rules and organized imports.
- Split action typing validation out of the main build workflow and narrowed dependency audit triggers to dependency
  files.
- Updated package metadata and bundled action startup, including top-level `await` entrypoint execution and clearer
  install success logging.
- Simplified artifact target mapping while keeping Acton archive and checksum naming consistent across supported
  platforms.

### Fixed

- Fixed installed Acton version detection so execution or parsing failures return `unknown` with debug logging instead
  of failing an otherwise successful installation.
- Fixed latest-version resolution so GitHub release lookup failures surface directly instead of silently resolving to
  `unknown`.

## [0.1.0] - 28.04.2026

setup-acton 0.1.0 rebuilds the action around the current Acton release artifacts. It migrates release lookups to
`ton-blockchain`, adds explicit platform and architecture selection, verifies downloaded archives with `SHA-256`
checksums, reports the installed Acton version, and expands the test, security, and release automation around the
bundled action.

### Added

- Added `version`, `platform`, `architecture`, and `github-token` action input metadata with descriptions and typed
  validation through `action-types.yml`.
- Added explicit runner platform and architecture resolution for `linux`, `apple`, and `windows` targets on `x86_64` and
  `aarch64`.
- Added artifact name resolution for the current Acton archive layout, including Linux GNU, Apple Darwin, and Windows
  MSVC targets.
- Added `SHA-256` checksum verification for downloaded Acton archives, including release checksum asset parsing and a
  generated known-checksum manifest for stable Acton releases.
- Added `acton-version` output populated from the installed `acton --version` result.
- Added debug logging for resolved inputs, action constants, downloaded file sizes, extracted binary sizes, and
  latest-version fallback behavior.
- Added CI coverage for build, lint, test, packaging, stale `dist` detection, dependency audits, GitHub Actions typing
  validation, and Zizmor workflow checks.
- Added a release workflow that validates tag/package version alignment, runs audits and project checks, verifies the
  bundled action, and creates GitHub releases for version tags.
- Added unit tests for input handling, semantic version normalization, artifact naming, checksum parsing and
  verification, download behavior, installed version parsing, and the action entrypoint.

### Changed

- Renamed the user-facing version input from `acton-version` to `version`. Bare semantic versions such as `X.Y.Z` are
  now normalized to `vX.Y.Z`, while custom labels such as `trunk` are preserved.
- Replaced the old `darwin` platform value with `apple` to match the current Acton release artifact names.
- The action now adds the directory containing the installed `acton` binary to `PATH` and returns the full binary path
  through `acton-path`.
- Downloading now uses GitHub release asset API URLs with authentication headers instead of unauthenticated browser
  download URLs.
- Project tooling moved from Yarn to Bun, with refreshed dependencies, updated lint configuration, import sorting, and
  Bun-based scripts.

### Fixed

- Fixed `PATH` handling so GitHub Actions receives the installed binary directory instead of the binary path itself.
- Fixed `acton-path` output by resolving the extracted `acton` binary inside the downloaded archive.
- Fixed artifact lookup for renamed Apple/macOS targets and the current Acton archive naming scheme.
- Fixed download failure handling so missing archive and checksum assets fail before extraction.
- Fixed checksum handling so mismatched asset names, invalid checksum files, empty checksum values, and checksum
  mismatches are reported clearly.
- Fixed minor spelling, metadata, and logging issues, including a final success message after installation completes.

## [0.0.1] - 17.02.2026

setup-acton 0.0.1 is the initial action release for installing Acton in GitHub Actions workflows. It downloads the
requested Acton release archive, extracts the binary, and exposes the installed path for later workflow steps.

### Added

- Added the initial `setup-acton` GitHub Action running on Node 24.
- Added release lookup and archive download support for Acton through the GitHub Releases API.
- Added `acton-version` input with `latest` as the default version selector.
- Added `github-token` input for authenticated GitHub API and asset download requests.
- Added runner platform and architecture detection for selecting Acton artifacts.
- Added `acton-path` output for the installed Acton binary path.
- Added TypeScript, Rollup, Jest, ESLint, Prettier, and packaged `dist` setup for the bundled action.
