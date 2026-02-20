import * as core from "@actions/core"
import { OWNER, REPO } from "./constants"
import type { GitHub } from "./github"

async function getLatestVersion(github: GitHub): Promise<string> {
  const octokit = github.getOctokit()

  const { data: release } = await octokit.rest.repos.getLatestRelease({ owner: OWNER, repo: REPO })
  return release.tag_name
}

function versionNormalize(version: string): string {
  if (version.startsWith("v")) {
    return version
  }

  const re = new RegExp("^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$")
  if (re.test(version)) {
    return `v${version}`
  }

  return version
}

export async function resolveVersion(inputVersion: string, github: GitHub): Promise<string> {
  if (inputVersion !== "latest") {
    return versionNormalize(inputVersion)
  }

  core.debug("Fetching latest version from GitHub...")
  return await getLatestVersion(github)
}
