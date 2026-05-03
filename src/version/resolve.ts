import * as core from "@actions/core"
import type { GitHub } from "@/utils/github"
import { readActonTomlVersion } from "@/version/acton-toml-version"
import { getLatestVersion } from "./github-version"

export type Version = "latest" | "trunk" | string

const versionTagPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

export function versionNormalize(version: string): Version {
  if (version.startsWith("v")) {
    return version
  }

  if (versionTagPattern.test(version)) {
    return `v${version}`
  }

  return version
}

async function getVersion(inputVersion: string, workspacePath: string, github: GitHub): Promise<Version> {
  if (inputVersion === "") {
    const actonTomlVersion = readActonTomlVersion(workspacePath)
    if (actonTomlVersion !== undefined) {
      core.debug(`Resolved version from Acton.toml: ${actonTomlVersion}`)
      return actonTomlVersion
    }

    return await getLatestVersion(github)
  }

  if (inputVersion === "latest") {
    return await getLatestVersion(github)
  }

  core.debug(`Using explicit input version: ${inputVersion}`)
  return inputVersion
}

export async function resolveVersion(inputVersion: string, workspacePath: string, github: GitHub): Promise<Version> {
  const version = await getVersion(inputVersion, workspacePath, github)
  return versionNormalize(version)
}
