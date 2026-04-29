import path from "node:path"
import * as core from "@actions/core"
import { resolveArchitecture } from "@/artifact/architecture"
import { Artifact } from "@/artifact/artifact"
import { resolvePlatform } from "@/artifact/platform"
import { BINARY_NAME, OWNER, REPO } from "@/utils/constants"
import { GitHub } from "@/utils/github"
import * as inputs from "@/utils/inputs"
import { getInstalledActonVersion } from "@/version/acton-version"
import { resolveVersion } from "@/version/tag-version"
import { downloadVersion } from "./download/download-version"

async function run(): Promise<void> {
  const inputVersion = inputs.getActonVersion()
  const inputPlatform = inputs.platformInput
  const inputArchitecture = inputs.architectureInput
  const githubToken = inputs.githubTokenInput

  core.debug(
    `Action inputs: ${JSON.stringify({
      version: inputVersion,
      platform: inputPlatform,
      architecture: inputArchitecture,
      "github-token": githubToken === "" ? "(empty)" : "[REDACTED]",
    })}`,
  )
  core.debug(
    `Action constants: ${JSON.stringify({
      owner: OWNER,
      repo: REPO,
      binaryName: BINARY_NAME,
    })}`,
  )

  const github = new GitHub(githubToken)

  const version = await resolveVersion(inputVersion, github)
  const platform = resolvePlatform(inputPlatform)
  const architecture = resolveArchitecture(inputArchitecture)

  const artifact = new Artifact(BINARY_NAME, version, platform, architecture)

  const { toolPath } = await downloadVersion(artifact, github)
  const actonVersion = await getInstalledActonVersion(toolPath)

  core.addPath(path.dirname(toolPath))
  core.setOutput("acton-path", toolPath)
  core.setOutput("acton-version", actonVersion)
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
