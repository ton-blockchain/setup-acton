import * as core from "@actions/core"
import path from "node:path"
import { BINARY_NAME } from "./constants"
import { downloadVersion } from "./download"
import { GitHub } from "./github"
import * as inputs from "./inputs"
import { getArchitecture, getPlatform } from "./os"
import { resolveVersion } from "./version"

async function run(): Promise<void> {
  const inputVersion = inputs.getActonVersion()
  const githubToken = inputs.githubToken

  const github = new GitHub(githubToken)

  const version = await resolveVersion(inputVersion, github)
  const platform = getPlatform()
  const architecture = getArchitecture()

  const { toolPath } = await downloadVersion(BINARY_NAME, version, platform, architecture, github)

  core.addPath(toolPath)
  core.setOutput("acton-path", path.join(toolPath, BINARY_NAME))
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
