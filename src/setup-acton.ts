import path from "node:path"
import * as core from "@actions/core"
import { resolveArchitecture } from "@/artifact/architecture"
import { Artifact } from "@/artifact/artifact"
import { resolvePlatform } from "@/artifact/platform"
import { Cache } from "@/cache/cache"
import { BINARY_NAME } from "@/utils/constants"
import { GitHub } from "@/utils/github"
import * as inputs from "@/utils/inputs"
import { getInstalledActonVersion } from "@/version/acton-version"
import { resolveVersion } from "@/version/resolve"
import { resolveToolchain } from "./download/download-version"

async function run(): Promise<void> {
  const inputVersion = inputs.versionInput
  const inputArchitecture = inputs.architectureInput
  const inputPlatform = inputs.platformInput
  const imputSaveCache = inputs.saveCacheInput()
  const inputWorkingDirectory = inputs.workingDirectoryInput
  const githubToken = inputs.githubTokenInput

  core.debug(
    `Action inputs: ${JSON.stringify({
      version: inputVersion,
      architecture: inputArchitecture,
      platform: inputPlatform,
      saveCache: imputSaveCache,
      "working-directory": inputWorkingDirectory,
      "github-token": githubToken === "" ? "(empty)" : "[REDACTED]",
    })}`,
  )
  const github = new GitHub(githubToken)

  const version = await resolveVersion(inputVersion, inputWorkingDirectory, github)
  const architecture = resolveArchitecture(inputArchitecture)
  const platform = resolvePlatform(inputPlatform)

  const artifact = new Artifact(BINARY_NAME, version, architecture, platform)

  core.debug(
    `Resolved version: ${JSON.stringify({
      version,
      architecture,
      platform,
      knownName: artifact.knownName,
      cacheKey: artifact.cacheKey,
    })}`,
  )

  if (version === "trunk") {
    core.warning("Using 'trunk' version is not recommended for production use. Consider using a specific version.")
  }

  const cache = new Cache(imputSaveCache)

  const { toolPath, useCache } = await resolveToolchain(artifact, cache, github)
  const actonVersion = await getInstalledActonVersion(toolPath)

  core.debug(
    `Resolved toolchain: ${JSON.stringify({
      toolPath,
      useCache,
      actonVersion,
    })}`,
  )

  core.addPath(path.dirname(toolPath))
  core.setOutput("acton-path", toolPath)
  core.setOutput("acton-version", actonVersion)
  core.setOutput("cache-hit", useCache)
  core.info(`Successfully installed Acton version ${actonVersion}`)
}

async function main(): Promise<void> {
  core.debug("Start setup-acton action")

  try {
    await run()
  } catch (error: unknown) {
    const message = error instanceof Error ? error : String(error)
    core.setFailed(message)
  }
}

await main()
