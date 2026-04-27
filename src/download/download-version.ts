import * as core from "@actions/core"
import * as tc from "@actions/tool-cache"
import * as fs from "node:fs"
import * as checksum from "@/download/checksum"
import path from "node:path"
import { OWNER, REPO } from "@/constants"
import type { GitHub } from "@/github"
import type { Artifact } from "@/artifact/artifact"

type ReleaseAsset = { name: string; url: string; browser_download_url: string }

async function downloadAsset(asset: ReleaseAsset, github: GitHub): Promise<string> {
  core.info(`Downloading ${asset.name} from ${asset.browser_download_url}`)
  const downloadPath = await tc.downloadTool(asset.url, undefined, github.getAuthToken(), {
    accept: "application/octet-stream",
  })
  if (core.isDebug()) {
    const stats = fs.statSync(downloadPath)
    core.debug(`Downloaded ${downloadPath} with size ${stats.size}`)
  }

  return downloadPath
}

export async function downloadVersion(artifact: Artifact, github: GitHub): Promise<{ toolPath: string }> {
  const octokit = github.getOctokit()

  const { artifactName, artifactVersion } = artifact
  core.info(`Downloading ${artifactName} from ${artifactVersion} release`)

  const { data: release } = await octokit.rest.repos.getReleaseByTag({ owner: OWNER, repo: REPO, tag: artifactVersion })
  const toolchainAsset = release.assets.find((asset) => asset.name === artifactName)
  if (toolchainAsset === undefined) {
    throw new Error(`Asset ${artifactName} in release ${artifactVersion} not found`)
  }

  const toolchainPath = await downloadAsset(toolchainAsset, github)

  const checksumAssetName = `${artifactName}.sha256`
  const checksumAsset = release.assets.find((asset) => asset.name === checksumAssetName)
  if (checksumAsset === undefined) {
    throw new Error(`Checksum asset ${checksumAssetName} in release ${artifactVersion} not found`)
  }

  const checksumPath = await downloadAsset(checksumAsset, github)

  checksum.verifyChecksum(toolchainPath, checksumPath, artifactName)
  core.info(`Verified ${artifactName} SHA-256 checksum`)

  const extractedPath = await tc.extractTar(toolchainPath)

  const toolPath = path.join(extractedPath, artifact.name)
  if (core.isDebug()) {
    const stats = fs.statSync(toolPath)
    core.debug(`Extracted ${toolPath} with size ${stats.size}`)
  }

  core.debug(`Saved extracted path: ${toolPath}`)
  return { toolPath: toolPath }
}
