import * as core from "@actions/core"
import process from "node:process"

export type Architecture = "x86_64" | "aarch64"

function getArchitecture(): Architecture {
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

export function resolveArchitecture(inputArchitecture: string): Architecture {
  if (inputArchitecture !== "") {
    return inputArchitecture as Architecture
  }

  return getArchitecture()
}
