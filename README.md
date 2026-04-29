# setup-acton

This action sets up [Acton](https://github.com/ton-blockchain/acton) for use in GitHub Actions by:

- Downloading a requested Acton release archive and adding `acton` to the `PATH`
- Exposing the installed binary path and detected Acton version as outputs

## Contents

- [Usage](#usage)
  - [Install Acton](#install-acton)
  - [Using outputs](#using-outputs)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Supported version syntax](#supported-version-syntax)
- [Supported targets](#supported-targets)
- [Recommended permissions](#recommended-permissions)
- [Checksum verification](#checksum-verification)
- [Development](#development)

## Usage

### Install Acton

```yaml
steps:
  - name: Setup Acton
    uses: ton-blockchain/setup-acton@b38f91528737c5b0d459c9dde674474b9edbe0c8 # v0.1.0
```

If you do not specify a version, this action installs the latest Acton release.

See [action.yml](action.yml).

```yaml
- name: Setup Acton
  uses: ton-blockchain/setup-acton@b38f91528737c5b0d459c9dde674474b9edbe0c8 # v0.1.0
  with:
    # Acton version to install.
    # Supported values include 'latest', a release tag such as 'v1.0.0',
    # or a bare semantic version such as '1.0.0'.
    version: '1.0.0'

    # Target architecture. Auto-detected from the runner if not specified.
    # Supported values: x86_64, aarch64.
    architecture: 'x86_64'

    # Target platform. Auto-detected from the runner if not specified.
    # Supported values: linux, apple, windows.
    platform: 'linux'

    # GitHub token for authenticated release metadata and asset downloads.
    github-token: ${{ github.token }}
```

### Using outputs

```yaml
steps:
  - name: Setup Acton
    uses: ton-blockchain/setup-acton@b38f91528737c5b0d459c9dde674474b9edbe0c8 # v0.1.0
    id: setup-acton
    with:
      version: '1.0.0'

  - run: |
      echo "Acton path: ${{ steps.setup-acton.outputs.acton-path }}"
      echo "Acton version: ${{ steps.setup-acton.outputs.acton-version }}"
```

## Inputs

| Name           | Required | Default               | Description                                                                          |
|----------------|----------|-----------------------|--------------------------------------------------------------------------------------|
| `version`      | No       | `latest`              | Acton version to install. See [Supported version syntax](#supported-version-syntax). |
| `architecture` | No       | Runner architecture   | Target architecture. See [Supported targets](#supported-targets).                    |
| `platform`     | No       | Runner platform       | Target platform. See [Supported targets](#supported-targets).                        |
| `github-token` | No       | `${{ github.token }}` | GitHub token used to fetch release metadata and release assets.                      |

## Outputs

| Name            | Description                                                                                                 |
|-----------------|-------------------------------------------------------------------------------------------------------------|
| `acton-path`    | Full path to the installed `acton` binary.                                                                  |
| `acton-version` | Installed Acton version parsed from `acton --version`; returns `unknown` if the version cannot be detected. |

## Supported version syntax

The `version` input supports the following syntax and resolution behavior:

- **Latest release** - If `version` is `latest` or omitted, the action fetches the latest GitHub release from
  `ton-blockchain/acton`.
- **Release tag** - If `version` starts with `v`, the value is used as the release tag, for example `v1.0.0`.
- **Bare semantic version** - If `version` is a plain semantic version such as `1.0.0`, it is normalized to `v1.0.0`.
- **Custom release tag** - Any other value is passed through unchanged and must match an existing Acton release tag.

After resolving the release tag, the action downloads the matching archive for the selected platform and architecture.

> **Warning**: We recommend pinning a versioned Acton release for reproducible workflows. Use `latest` or other
> non-version tags only when you explicitly want the workflow to track a moving release.

> **Note**: It is recommended to wrap version values in single quotation marks to avoid YAML parsing surprises:
>
> ```yaml
> version: '1.0.0'
> ```

## Supported targets

The action can resolve the following platform targets:

| Platform input | Artifact target     |
|----------------|---------------------|
| `linux`        | `unknown-linux-gnu` |
| `apple`        | `apple-darwin`      |
| `windows`      | `pc-windows-msvc`   |

The action can resolve the following architecture targets:

| Architecture input | Artifact architecture |
|--------------------|-----------------------|
| `x86_64`           | `x86_64`              |
| `aarch64`          | `aarch64`             |

## Recommended permissions

When using the `setup-acton` action in your GitHub Actions workflow, it is recommended to set the following permissions:

```yaml
permissions:
  contents: read # access release metadata and release assets
```

## Checksum verification

The downloaded Acton archive must match the expected `SHA-256` checksum. If the checksum does not match, the action
fails before extracting or adding `acton` to `PATH`.

## Development

This repository uses Bun for local development.

```bash
bun ci
bun run all
```

`dist/index.js` is committed because GitHub Actions runs the bundled file declared in [action.yml](action.yml).

## Code of Conduct

This project follows the [Acton Code of Conduct](https://github.com/ton-blockchain/acton/blob/master/CODE_OF_CONDUCT.md).

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
