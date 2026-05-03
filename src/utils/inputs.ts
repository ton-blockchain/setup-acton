import * as core from "@actions/core"

export const versionInput = core.getInput("version")
export const architectureInput = core.getInput("architecture")
export const platformInput = core.getInput("platform")
export const workingDirectoryInput = core.getInput("working-directory")
export const githubTokenInput = core.getInput("github-token", { required: true })

export function saveCacheInput(): boolean {
  const saveCache = core.getInput("save-cache").toLowerCase()

  const valueMapping: Partial<Record<string, boolean>> = {
    true: true,
    false: false,
  } as const

  const value = valueMapping[saveCache]
  if (value === undefined) {
    throw new Error(`Invalid value for save-cache: ${saveCache}`)
  }

  return value
}
