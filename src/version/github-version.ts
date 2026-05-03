import * as core from "@actions/core"
import { OWNER, REPO } from "@/utils/constants"
import type { GitHub } from "@/utils/github"

export async function getLatestVersion(github: GitHub): Promise<string> {
  core.debug("Fetching latest version from GitHub...")
  const octokit = github.getOctokit()

  const { data: release } = await octokit.rest.repos.getLatestRelease({ owner: OWNER, repo: REPO })
  core.debug(`Fetched latest Acton release: ${release.tag_name}`)
  return release.tag_name
}
