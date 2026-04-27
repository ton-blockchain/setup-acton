import * as core from "@actions/core"
import { OWNER, REPO } from "@/utils/constants"
import type { GitHub } from "@/utils/github"

const versionTagPattern = new RegExp("^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$")

async function getLatestVersion(github: GitHub): Promise<string> {
  const octokit = github.getOctokit()

  const { data: release } = await octokit.rest.repos.getLatestRelease({ owner: OWNER, repo: REPO })
  return release.tag_name
}

function versionNormalize(version: string): string {
  if (version.startsWith("v")) {
    return version
  }

  if (versionTagPattern.test(version)) {
    return `v${version}`
  }

  return version
}

export async function resolveVersion(inputVersion: string, github: GitHub): Promise<string> {
  if (inputVersion !== "latest") {
    return versionNormalize(inputVersion)
  }

  core.debug("Fetching latest version from GitHub...")
  try {
    const version = await getLatestVersion(github)
    return version
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    core.debug(`Failed to fetch latest version from GitHub: ${message}`)
    return "unknown"
  }
}
