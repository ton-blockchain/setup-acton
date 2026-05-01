import * as core from "@actions/core"

export const versionInput = core.getInput("version")
export const architectureInput = core.getInput("architecture")
export const platformInput = core.getInput("platform")
export const workingDirectoryInput = core.getInput("working-directory")
export const githubTokenInput = core.getInput("github-token", { required: true })
