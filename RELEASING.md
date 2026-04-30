# Releasing setup-acton

This document covers maintainer release steps for versioned `setup-acton` releases.

## Prerequisites

- `master` is up to date with `origin/master`
- the worktree is clean
- `CHANGELOG.md` has a section for the target version
- `package.json` version matches the target release version
- `dist/index.js` is up to date
- GitHub Actions checks pass on `master`

## Local Verification

Run:

```bash
bun ci
bun run all
git diff --text --exit-code -- dist
```

## Tagging

Create and push an annotated version tag:

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

The release workflow validates the package version, runs the full check suite, verifies `dist/index.js`, and creates the
GitHub release.

## After Release

- Confirm that the GitHub release exists.
- Confirm that the release notes are useful.
- Update examples that pin the action to a commit SHA or version tag when necessary.
