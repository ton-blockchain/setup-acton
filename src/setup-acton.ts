import * as core from "@actions/core"
import path from "node:path"
import { BINARY_NAME } from "./constants"
import * as inputs from "./inputs"
import { downloadVersion } from "./download"
import { GitHub } from "./github"
import { resolveArchitecture } from "./architecture"
import { resolvePlatform } from "./platform"
import { resolveVersion } from "./version"

async function run(): Promise<void> {
  const inputVersion = inputs.getActonVersion()
  const inputPlatform = inputs.platformInput
  const inputArchitecture = inputs.architectureInput

  const githubToken = inputs.githubTokenInput
  const github = new GitHub(githubToken)

  const version = await resolveVersion(inputVersion, github)
  const platform = resolvePlatform(inputPlatform)
  const architecture = resolveArchitecture(inputArchitecture)

  const { toolPath } = await downloadVersion(BINARY_NAME, version, platform, architecture, github)

  core.addPath(toolPath)
  core.setOutput("acton-path", toolPath)
}

async function main(): Promise<void> {
  core.debug("Start setup-action action")

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
