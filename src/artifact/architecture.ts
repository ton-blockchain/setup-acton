import process from "node:process"
import * as core from "@actions/core"

export type Architecture = "x86_64" | "aarch64"

function getArchitecture(): Architecture {
  const { arch: nodeArchitecture } = process
  core.debug(`Detected architecture: ${nodeArchitecture}`)

  const architectureMapping: { [A in NodeJS.Architecture]?: Architecture } = {
    x64: "x86_64",
    arm64: "aarch64",
  } as const

  const architecture = architectureMapping[nodeArchitecture]
  if (architecture !== undefined) {
    return architecture
  }

  throw new Error(`Unsupported architecture: ${nodeArchitecture}`)
}

export function resolveArchitecture(inputArchitecture: string): Architecture {
  if (inputArchitecture !== "") {
    return inputArchitecture as Architecture
  }

  return getArchitecture()
}
