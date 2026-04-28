import process from "node:process"
import * as core from "@actions/core"

export type Platform = "linux" | "apple" | "windows"

function getPlatform(): Platform {
  const platform = process.platform
  core.debug(`Detected platform: ${platform}`)

  const platformMapping: { [P in NodeJS.Platform]?: Platform } = {
    darwin: "apple",
    win32: "windows",
    linux: "linux",
  } as const

  const plat = platformMapping[platform]
  if (plat !== undefined) {
    return plat
  }

  throw new Error(`Unsupported platform: ${platform}`)
}

export function resolvePlatform(inputPlatform: string): Platform {
  if (inputPlatform !== "") {
    return inputPlatform as Platform
  }

  return getPlatform()
}
