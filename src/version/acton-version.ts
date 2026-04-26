import { getExecOutput } from "@actions/exec"

const actonVersionPattern = new RegExp("^acton\\s+(?<version>\\S+)(?:\\s+\\(|$)")

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
  const output = await runActonVersion(toolPath)
  return parseActonVersion(output)
}
