import * as fs from "node:fs"
import * as os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const warningMock = vi.fn<(message: string) => void>()

vi.doMock(
  "@actions/core",
  (): Record<string, unknown> => ({
    warning: warningMock,
  }),
)

const { parseActonTomlVersion, readActonTomlVersion }: typeof import("@/version/acton-toml-version") = await import(
  "@/version/acton-toml-version"
)
const invalidActonVersionMessage = "Invalid Acton.toml: [toolchain].acton must be a non-empty string"

let tempDir: string | undefined

function createTempDir(): string {
  tempDir ??= fs.mkdtempSync(path.join(os.tmpdir(), "setup-acton-toml-"))
  return tempDir
}

function writeActonToml(contents: string): void {
  fs.writeFileSync(path.join(createTempDir(), "Acton.toml"), contents)
}

describe("parseActonTomlVersion", (): void => {
  beforeEach((): void => {
    warningMock.mockClear()
  })

  it("reads the Acton version from the toolchain section", (): void => {
    expect(
      parseActonTomlVersion(`
[toolchain]
acton = "0.3.2"
`),
    ).toBe("0.3.2")
    expect(warningMock).not.toHaveBeenCalled()
  })

  it("supports TOML comments, whitespace, and single-quoted versions", (): void => {
    expect(
      parseActonTomlVersion(`
# Project configuration
[toolchain] # Runtime toolchain
  acton = '0.3.2' # Pinned version
`),
    ).toBe("0.3.2")
  })

  it("ignores acton values outside the toolchain section", (): void => {
    expect(
      parseActonTomlVersion(`
[project]
acton = "0.1.0"

[toolchain.dependencies]
acton = "0.2.0"
`),
    ).toBeUndefined()
  })

  it("stops reading the toolchain section at the next section", (): void => {
    expect(
      parseActonTomlVersion(`
[toolchain]
name = "acton"

[project]
acton = "0.3.2"
`),
    ).toBeUndefined()
  })

  it("returns undefined when the toolchain section has no Acton version", (): void => {
    expect(
      parseActonTomlVersion(`
[toolchain]
python = "3.12"
`),
    ).toBeUndefined()
  })

  it("returns undefined when toolchain is not a table", (): void => {
    expect(parseActonTomlVersion('toolchain = "0.3.2"')).toBeUndefined()
    expect(warningMock).not.toHaveBeenCalled()
  })

  it.each([
    "acton = 1",
    'acton = ""',
    "acton = []",
  ] as const)("warns and returns undefined when [toolchain].acton is not a non-empty string: %s", (line): void => {
    expect(
      parseActonTomlVersion(`
[toolchain]
${line}
`),
    ).toBeUndefined()
    expect(warningMock).toHaveBeenCalledWith(invalidActonVersionMessage)
  })

  it("propagates TOML parser errors", (): void => {
    expect((): string | undefined => parseActonTomlVersion("[toolchain]\nacton = 0.3.2")).toThrow()
  })
})

describe("readActonTomlVersion", (): void => {
  afterEach((): void => {
    if (tempDir !== undefined) {
      fs.rmSync(tempDir, { force: true, recursive: true })
      tempDir = undefined
    }
  })

  it("returns undefined when Acton.toml does not exist", (): void => {
    expect(readActonTomlVersion(createTempDir())).toBeUndefined()
  })

  it("reads Acton.toml from the provided workspace path", (): void => {
    writeActonToml(`
[toolchain]
acton = "0.3.2"
`)

    expect(readActonTomlVersion(createTempDir())).toBe("0.3.2")
  })
})
