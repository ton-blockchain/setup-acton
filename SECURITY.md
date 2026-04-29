# Security Policy

We take security issues seriously, especially because this action downloads and adds a binary to `PATH` in CI
environments.

## Reporting a Vulnerability

Please do not report security vulnerabilities in public issues.

Use GitHub's private vulnerability reporting flow for this
repository: https://github.com/ton-blockchain/setup-acton/security/advisories/new

When possible, include:

- affected version, tag, or commit
- a short impact description
- reproduction steps or proof of concept
- relevant workflow, runner, platform, and architecture details

Do not include real private keys, seed phrases, GitHub tokens, or other sensitive credentials in the report.

## Supported Versions

Security fixes are provided on a best-effort basis for:

- the latest released `setup-acton` version
- the current `master` branch

Older versions may not receive backported fixes. Users should usually upgrade to the latest release.

## Disclosure

Please do not disclose a vulnerability publicly until maintainers have had a reasonable opportunity to investigate and
ship or coordinate a fix.

When a report results in a user-relevant fix, the project should document it in the changelog and, when appropriate, in
a GitHub Security Advisory.
