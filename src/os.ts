import * as core from "@actions/core"
import process from "node:process"

export type Platform = "linux" | "darwin" | "windows"
export type Architecture = "x86_64" | "aarch64"

export function getArchitecture(): Architecture {
  const architecture = process.arch
  core.debug(`Detected architecture: ${architecture}`)

  const architectureMapping: { [A in NodeJS.Architecture]?: Architecture } = {
    x64: "x86_64",
    arm64: "aarch64",
  } as const

  const arch = architectureMapping[architecture]
  if (arch !== undefined) {
    return arch
  }

  throw new Error(`Unsupported architecture: ${architecture}`)
}

export function getPlatform(): Platform {
  const platform = process.platform
  core.debug(`Detected platform: ${platform}`)

  const platformMapping: { [P in NodeJS.Platform]?: Platform } = {
    darwin: "darwin",
    win32: "windows",
    linux: "linux",
  } as const

  const plat = platformMapping[platform]
  if (plat !== undefined) {
    return plat
  }

  throw new Error(`Unsupported platform: ${platform}`)
}
