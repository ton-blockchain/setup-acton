import type { GitHub } from "@/utils/github"
import { readActonTomlVersion } from "@/version/acton-toml-version"
import { getLatestVersion } from "./github-version"

type Version = "latest" | "draft" | string

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
  if (inputVersion !== "") {
    if (inputVersion === "latest") {
      return await getLatestVersion(github)
    }

    return inputVersion
  }

  const actonTomlVersion = readActonTomlVersion(workspacePath)
  if (actonTomlVersion !== undefined) {
    return actonTomlVersion
  }

  return await getLatestVersion(github)
}

export async function resolveVersion(inputVersion: string, workspacePath: string, github: GitHub): Promise<Version> {
  const version = await getVersion(inputVersion, workspacePath, github)
  return versionNormalize(version)
}
