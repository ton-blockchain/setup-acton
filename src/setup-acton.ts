import * as core from "@actions/core"
import { BINARY_NAME, OWNER, REPO } from "@/constants"
import * as inputs from "@/inputs"
import { downloadVersion } from "@/download"
import { GitHub } from "@/github"
import { resolveArchitecture } from "@/artifact/architecture"
import { resolvePlatform } from "@/artifact/platform"
import { resolveVersion } from "@/version/tag-version"
import { Artifact } from "@/artifact/artifact"
import path from "node:path"
import { getInstalledActonVersion } from "@/version/acton-version"

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

main()
