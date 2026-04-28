import * as core from "@actions/core"
import * as tc from "@actions/tool-cache"
import * as fs from "node:fs"
import path from "node:path"
import type { Artifact } from "@/artifact/artifact"
import * as checksum from "@/download/checksum"
import { OWNER, REPO } from "@/utils/constants"
import type { GitHub } from "@/utils/github"

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

  const { archiveName, version, checksumName } = artifact
  core.info(`Downloading ${archiveName} from ${version} release`)

  const { data: release } = await octokit.rest.repos.getReleaseByTag({ owner: OWNER, repo: REPO, tag: version })

  const toolchainAsset = release.assets.find((asset) => asset.name === archiveName)
  if (toolchainAsset === undefined) {
    throw new Error(`Asset ${archiveName} in release ${version} not found`)
  }

  const checksumAsset = release.assets.find((asset) => asset.name === checksumName)
  if (checksumAsset === undefined) {
    throw new Error(`Checksum asset ${checksumName} in release ${version} not found`)
  }

  const expectedChecksum = await getExpectedChecksum(artifact, checksumAsset, github)
  const toolchainPath = await downloadAsset(toolchainAsset, github)

  checksum.verifyChecksum(toolchainPath, expectedChecksum, archiveName)
  core.info(`Verified ${archiveName} SHA-256 checksum`)

  const extractedPath = await tc.extractTar(toolchainPath)

  const toolPath = path.join(extractedPath, artifact.name)
  if (core.isDebug()) {
    const stats = fs.statSync(toolPath)
    core.debug(`Extracted ${toolPath} with size ${stats.size}`)
  }

  core.debug(`Saved extracted path: ${toolPath}`)
  return { toolPath: toolPath }
}

async function getExpectedChecksum(artifact: Artifact, checksumAsset: ReleaseAsset, github: GitHub): Promise<string> {
  const knownChecksum = checksum.getChecksumFromKnownList(artifact.knownName)
  if (knownChecksum !== undefined) {
    core.debug(`Using known checksum ${knownChecksum} for ${artifact.knownName}`)
    return knownChecksum
  }

  core.debug(`Using checksum from file ${checksumAsset.browser_download_url} for ${artifact.archiveName}`)
  const checksumPath = await downloadAsset(checksumAsset, github)
  return checksum.getChecksumFromFile(checksumPath, artifact.archiveName)
}
