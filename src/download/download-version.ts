import * as fs from "node:fs"
import * as os from "node:os"
import path from "node:path"
import * as core from "@actions/core"
import * as io from "@actions/io"
import * as tc from "@actions/tool-cache"
import type { Artifact } from "@/artifact/artifact"
import type { Cache } from "@/cache/cache"
import * as checksum from "@/download/checksum"
import { OWNER, REPO } from "@/utils/constants"
import type { GitHub } from "@/utils/github"

type Toolchain = { toolPath: string; useCache: boolean }
type ReleaseAsset = { name: string; url: string; browser_download_url: string }

function getInstalledPath(): string {
  return path.join(os.homedir(), ".acton", "bin")
}

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

export async function downloadVersion(artifact: Artifact, github: GitHub): Promise<Toolchain> {
  const octokit = github.getOctokit()

  const { archiveName, version, checksumName } = artifact
  core.info(`Downloading ${archiveName} from ${version} release`)

  const { data: release } = await octokit.rest.repos.getReleaseByTag({ owner: OWNER, repo: REPO, tag: version })

  const toolchainAsset = release.assets.find((asset) => asset.name === archiveName)
  if (toolchainAsset === undefined) {
    throw new Error(`Archive ${archiveName} not found in release ${version}`)
  }

  const checksumAsset = release.assets.find((asset) => asset.name === checksumName)
  if (checksumAsset === undefined) {
    throw new Error(`Checksum file ${checksumName} not found in release ${version}`)
  }

  const expectedChecksum = await getExpectedChecksum(artifact, checksumAsset, github)
  const toolchainPath = await downloadAsset(toolchainAsset, github)

  checksum.verifyChecksum(toolchainPath, expectedChecksum, archiveName)
  core.info(`Verified ${archiveName} SHA-256 checksum`)

  const installedPath = getInstalledPath()
  {
    const extractedPath = await tc.extractTar(toolchainPath)
    const sourcePath = path.join(extractedPath, artifact.name)

    await io.mkdirP(installedPath)
    await io.mv(sourcePath, installedPath)
  }

  const toolPath = path.join(installedPath, artifact.name)
  if (core.isDebug()) {
    const stats = fs.statSync(toolPath)
    core.debug(`Extracted ${toolPath} with size ${stats.size}`)
  }

  core.debug(`Saved extracted path: ${toolPath}`)
  return { toolPath, useCache: false }
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

export async function resolveToolchain(artifact: Artifact, cache: Cache, github: GitHub): Promise<Toolchain> {
  if (!cache.saveCache) {
    return await downloadVersion(artifact, github)
  }

  const toolPath = path.join(getInstalledPath(), artifact.name)
  const actonCache = await cache.restore(toolPath, artifact.cacheKey)
  if (actonCache) {
    return { toolPath, useCache: true }
  }

  core.debug(`Cache miss for key ${artifact.cacheKey}; downloading toolchain from GitHub`)
  return await downloadVersion(artifact, github)
}
