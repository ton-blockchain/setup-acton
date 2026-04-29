import process from "node:process"
import * as core from "@actions/core"

export type Platform = "linux" | "apple" | "windows"

function getPlatform(): Platform {
  const { platform: nodePlatform } = process
  core.debug(`Detected platform: ${nodePlatform}`)

  const platformMapping: { [P in NodeJS.Platform]?: Platform } = {
    darwin: "apple",
    win32: "windows",
    linux: "linux",
  } as const

  const platform = platformMapping[nodePlatform]
  if (platform !== undefined) {
    return platform
  }

  throw new Error(`Unsupported platform: ${nodePlatform}`)
}

export function resolvePlatform(inputPlatform: string): Platform {
  if (inputPlatform !== "") {
    return inputPlatform as Platform
  }

  return getPlatform()
}
