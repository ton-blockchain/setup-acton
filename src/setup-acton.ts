import * as core from "@actions/core"
import { BINARY_NAME, OWNER, REPO } from "./constants"
import * as inputs from "./inputs"
import { downloadVersion } from "./download"
import { GitHub } from "./github"
import { resolveArchitecture } from "./architecture"
import { resolvePlatform } from "./platform"
import { resolveVersion } from "./version"
import path from "node:path"

async function run(): Promise<void> {
  const inputVersion = inputs.getActonVersion()
  const inputPlatform = inputs.platformInput
  const inputArchitecture = inputs.architectureInput
  const githubToken = inputs.githubTokenInput

  core.debug(
    `Action inputs: ${JSON.stringify({
      "acton-version": inputVersion,
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

  const { toolPath } = await downloadVersion(BINARY_NAME, version, platform, architecture, github)

  core.addPath(path.dirname(toolPath))
  core.setOutput("acton-path", toolPath)
}

async function main(): Promise<void> {
  core.debug("Start setup-acton action")

  try {
    await run()
  } catch (error: unknown) {
    let message: string
    if (error instanceof Error) {
      message = error.message
    } else {
      message = String(error)
    }

    core.setFailed(message)
  }
}

main()
