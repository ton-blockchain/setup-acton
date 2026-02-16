import * as core from "@actions/core"

export const githubToken = core.getInput("github-token", { required: true })

export function getActonVersion(): string {
  const version = core.getInput("acton-version")
  if (version !== "") {
    return version
  }

  return "latest"
}
