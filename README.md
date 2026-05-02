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
- [Version resolution](#version-resolution)
- [Supported targets](#supported-targets)
- [Recommended permissions](#recommended-permissions)
- [Checksum verification](#checksum-verification)

## Usage

### Install Acton

```yaml
steps:
  - name: Setup Acton
    uses: ton-blockchain/setup-acton@f4da2bdcbadcb64cd678b171d9888ad16946100e # v0.2.0
```

If you do not specify a version, this action reads `Acton.toml` from `working-directory` first and falls back to the
latest Acton release when no project version is configured.

See [action.yml](action.yml).

```yaml
- name: Setup Acton
  uses: ton-blockchain/setup-acton@f4da2bdcbadcb64cd678b171d9888ad16946100e # v0.2.0
  with:
    # Acton version to install.
    # Supported values include 'latest', a release tag such as 'v1.0.0',
    # or a bare semantic version such as '1.0.0'.
    # Defaults to the version in Acton.toml or 'latest'.
    version: '1.0.0'

    # Target architecture. Auto-detected from the runner if not specified.
    # Supported values: x86_64, aarch64.
    architecture: 'x86_64'

    # Target platform. Auto-detected from the runner if not specified.
    # Supported values: linux, apple, windows.
    platform: 'linux'

    # Working directory for the Acton project. Defaults to the GitHub workspace.
    working-directory: ${{ github.workspace }}

    # GitHub token for authenticated release metadata and asset downloads.
    github-token: ${{ github.token }}
```

### Using outputs

```yaml
steps:
  - name: Setup Acton
    uses: ton-blockchain/setup-acton@f4da2bdcbadcb64cd678b171d9888ad16946100e # v0.2.0
    id: setup-acton
    with:
      version: '1.0.0'

  - run: |
      echo "Acton path: ${{ steps.setup-acton.outputs.acton-path }}"
      echo "Acton version: ${{ steps.setup-acton.outputs.acton-version }}"
```

## Inputs

| Name                | Required | Default                   | Description                                                                          |
|---------------------|----------|---------------------------|--------------------------------------------------------------------------------------|
| `version`           | No       | `Acton.toml` or `latest`  | Acton version to install. See [Version resolution](#version-resolution).             |
| `architecture`      | No       | Runner architecture       | Target architecture. See [Supported targets](#supported-targets).                    |
| `platform`          | No       | Runner platform           | Target platform. See [Supported targets](#supported-targets).                        |
| `working-directory` | No       | `${{ github.workspace }}` | Working directory for the Acton project.                                             |
| `github-token`      | No       | `${{ github.token }}`     | GitHub token used to fetch release metadata and release assets.                      |

## Outputs

| Name            | Description                                            |
|-----------------|--------------------------------------------------------|
| `acton-path`    | Full path to the installed `acton` binary.             |
| `acton-version` | Installed Acton version parsed from `acton --version`. |

> **Note**: `acton-version` returns `unknown` if the version cannot be detected.

## Version resolution

The action resolves the Acton version in this order:

- **`version` input** - If `version` is set, the action uses it. If the value is `latest`, the action fetches the latest
  GitHub release from `ton-blockchain/acton`.
- **`Acton.toml`** - If `version` is omitted, the action reads `[toolchain].acton` from `Acton.toml` in
  `working-directory`.
- **Latest release** - If no version is configured, the action gets the latest version from `ton-blockchain/acton`.

`Acton.toml` example:

```toml
[toolchain]
acton = "0.3.2"
```

The resolved version supports the following syntax:

- **Release tag** - If `version` starts with `v`, the value is used as the release tag, for example `v1.0.0`.
- **Bare semantic version** - If `version` is a plain semantic version such as `1.0.0`, it is normalized to `v1.0.0`.
- **Custom release tag** - Any other value is passed through unchanged and must match an existing Acton release tag.

After resolving the release tag, the action downloads the matching archive for the selected platform and architecture.

> **Warning**: We recommend pinning a versioned Acton release in `version` or `Acton.toml` for reproducible workflows.
> Use `latest` or other non-version tags only when you explicitly want the workflow to track a moving release.

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

```bash
bun ci
bun run all
```

`dist/setup/index.js` is committed because GitHub Actions runs the bundled file declared in [action.yml](action.yml).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, pull request expectations, and release asset maintenance notes.

## Security

Please report suspected vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## Code of Conduct

This project follows the [Acton Code of Conduct](CODE_OF_CONDUCT.md).

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
