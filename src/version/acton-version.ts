import * as core from "@actions/core"
import { getExecOutput } from "@actions/exec"

const actonVersionPattern = /^acton\s+(?<version>\S+)(?:\s+\(|$)/

async function runActonVersion(toolPath: string): Promise<string> {
  const { stdout } = await getExecOutput(toolPath, ["--version"], {
    silent: true,
  })

  return stdout
}

export function parseActonVersion(output: string): string {
  const trimmedOutput = output.trim()
  const version = actonVersionPattern.exec(trimmedOutput)?.groups?.version
  if (version === undefined) {
    throw new Error(`Unable to parse Acton version from output: ${JSON.stringify(trimmedOutput)}`)
  }

  return version
}

export async function getInstalledActonVersion(toolPath: string): Promise<string> {
  try {
    const output = await runActonVersion(toolPath)
    return parseActonVersion(output)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    core.debug(`Failed to get installed Acton version: ${message}`)
    return "unknown"
  }
}
