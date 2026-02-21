import * as core from "@actions/core"
import * as tc from "@actions/tool-cache"
import * as fs from "node:fs"
import path from "node:path"
import { OWNER, REPO } from "./constants"
import type { GitHub } from "./github"
import type { Platform } from "./platform"
import type { Architecture } from "./architecture"

function getArtifactName(artifact: string, platform: Platform, architecture: Architecture): string {
  return `${artifact}-${platform}-${architecture}.tar.gz`
}

export async function downloadVersion(
  artifact: string,
  version: string,
  platform: Platform,
  architecture: Architecture,
  github: GitHub,
): Promise<{ toolPath: string }> {
  const octokit = github.getOctokit()

  const artifactName = getArtifactName(artifact, platform, architecture)
  core.info(`Downloading ${artifactName} from ${version} release`)

  const { data: release } = await octokit.rest.repos.getReleaseByTag({ owner: OWNER, repo: REPO, tag: version })
  const asset = release.assets.find((asset) => asset.name === artifactName)
  if (asset === undefined) {
    throw new Error(`Asset ${artifactName} in release ${version} not found`)
  }

  core.info(`"Downloading ${artifactName} from ${asset.browser_download_url}"`)
  const downloadPath = await tc.downloadTool(asset.url, undefined, github.getAuthToken(), {
    accept: "application/octet-stream",
  })
  if (core.isDebug()) {
    const stats = fs.statSync(downloadPath)
    core.debug(`Download ${downloadPath} with size ${stats.size}`)
  }

  const extractedPath = await tc.extractTar(downloadPath)

  const toolPath = path.join(extractedPath, artifact)
  if (core.isDebug()) {
    const stats = fs.statSync(toolPath)
    core.debug(`Extracted ${toolPath} with size ${stats.size}`)
  }

  core.debug(`Save extracted path: ${toolPath}`)
  return { toolPath: toolPath }
}
