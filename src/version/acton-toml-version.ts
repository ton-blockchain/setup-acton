import * as fs from "node:fs"
import path from "node:path"
import * as core from "@actions/core"
import type { TomlTable, TomlValue } from "smol-toml"
import { parse } from "smol-toml"
import { ACTON_TOML_FILE_NAME } from "@/utils/constants"

function isTomlTable(value: TomlValue | undefined): value is TomlTable {
  return value !== undefined && typeof value === "object" && !Array.isArray(value)
}

export function parseActonTomlVersion(contents: string): string | undefined {
  const { toolchain } = parse(contents)
  if (!isTomlTable(toolchain)) {
    return undefined
  }

  const { acton: version } = toolchain
  if (version === undefined) {
    return undefined
  }

  if (typeof version !== "string" || version === "") {
    core.warning(`Invalid ${ACTON_TOML_FILE_NAME}: [toolchain].acton must be a non-empty string`)
    return undefined
  }

  return version
}

export function readActonTomlVersion(workspacePath: string): string | undefined {
  const actonTomlPath = path.join(workspacePath, ACTON_TOML_FILE_NAME)
  core.debug(`Reading Acton version from ${actonTomlPath}`)
  if (!fs.existsSync(actonTomlPath)) {
    return undefined
  }

  const content = fs.readFileSync(actonTomlPath, "utf8")
  return parseActonTomlVersion(content)
}
