import * as core from "@actions/core"
import * as tc from "@actions/tool-cache"
import * as fs from "node:fs"
import path from "node:path"
import { OWNER, REPO } from "@/constants"
import type { GitHub } from "@/github"
import type { Artifact } from "@/artifact/artifact"

export async function downloadVersion(artifact: Artifact, github: GitHub): Promise<{ toolPath: string }> {
  const octokit = github.getOctokit()

  const { artifactName, artifactVersion } = artifact
  core.info(`Downloading ${artifactName} from ${artifactVersion} release`)

  const { data: release } = await octokit.rest.repos.getReleaseByTag({ owner: OWNER, repo: REPO, tag: artifactVersion })
  const asset = release.assets.find((asset) => asset.name === artifactName)
  if (asset === undefined) {
    throw new Error(`Asset ${artifactName} in release ${artifactVersion} not found`)
  }

  core.info(`Downloading ${artifactName} from ${asset.browser_download_url}`)
  const downloadPath = await tc.downloadTool(asset.url, undefined, github.getAuthToken(), {
    accept: "application/octet-stream",
  })
  if (core.isDebug()) {
    const stats = fs.statSync(downloadPath)
    core.debug(`Downloaded ${downloadPath} with size ${stats.size}`)
  }

  const extractedPath = await tc.extractTar(downloadPath)

  const toolPath = path.join(extractedPath, artifact.name)
  if (core.isDebug()) {
    const stats = fs.statSync(toolPath)
    core.debug(`Extracted ${toolPath} with size ${stats.size}`)
  }

  core.debug(`Saved extracted path: ${toolPath}`)
  return { toolPath: toolPath }
}
