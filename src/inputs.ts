import * as core from "@actions/core"

export const githubTokenInput = core.getInput("github-token", { required: true })
export const architectureInput = core.getInput("architecture")
export const platformInput = core.getInput("platform")

export function getActonVersion(): string {
  const version = core.getInput("acton-version")
  if (version !== "") {
    return version
  }

  return "latest"
}
