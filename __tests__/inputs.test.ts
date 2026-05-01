import { beforeEach, describe, expect, it, vi } from "vitest"
import type * as inputsModule from "@/utils/inputs"

type InputsModule = typeof inputsModule

const getInputMock = vi.fn<(name: string, options?: Record<string, unknown>) => string>()

vi.doMock(
  "@actions/core",
  (): Record<string, unknown> => ({
    getInput: getInputMock,
  }),
)

async function importInputs(inputValues: Readonly<Record<string, string>> = {}): Promise<InputsModule> {
  vi.resetModules()
  getInputMock.mockReset()
  getInputMock.mockImplementation((name: string): string => inputValues[name] ?? "")

  return await import("@/utils/inputs")
}

describe("inputs", (): void => {
  beforeEach((): void => {
    getInputMock.mockReset()
  })

  it("reads top-level action inputs on module load", async (): Promise<void> => {
    const inputs = await importInputs({
      version: "v1.2.3",
      architecture: "aarch64",
      platform: "linux",
      "working-directory": "contracts",
      "github-token": "ghs_test",
    })

    expect(inputs.versionInput).toBe("v1.2.3")
    expect(inputs.architectureInput).toBe("aarch64")
    expect(inputs.platformInput).toBe("linux")
    expect(inputs.workingDirectoryInput).toBe("contracts")
    expect(inputs.githubTokenInput).toBe("ghs_test")
    expect(getInputMock).toHaveBeenCalledWith("version")
    expect(getInputMock).toHaveBeenCalledWith("architecture")
    expect(getInputMock).toHaveBeenCalledWith("platform")
    expect(getInputMock).toHaveBeenCalledWith("working-directory")
    expect(getInputMock).toHaveBeenCalledWith("github-token", { required: true })
  })

  it("uses empty strings for optional top-level inputs when they are not provided", async (): Promise<void> => {
    const inputs = await importInputs({
      "github-token": "ghs_test",
    })

    expect(inputs.versionInput).toBe("")
    expect(inputs.architectureInput).toBe("")
    expect(inputs.platformInput).toBe("")
    expect(inputs.workingDirectoryInput).toBe("")
    expect(inputs.githubTokenInput).toBe("ghs_test")
  })

  it.each([
    ["v1.2.3"],
    ["1.2.3"],
    ["latest"],
    ["trunk"],
    ["0.3.1-trunk"],
  ] as const)("reads the version input value %s", async (version): Promise<void> => {
    const inputs = await importInputs({
      version,
    })

    expect(inputs.versionInput).toBe(version)
    expect(getInputMock).toHaveBeenCalledWith("version")
    expect(getInputMock).not.toHaveBeenCalledWith("acton-version")
  })

  it("uses an empty string when the version input is empty", async (): Promise<void> => {
    const inputs = await importInputs()

    expect(inputs.versionInput).toBe("")
    expect(getInputMock).toHaveBeenCalledWith("version")
  })

  it("does not trim the version input", async (): Promise<void> => {
    const inputs = await importInputs({
      version: "  v1.2.3  ",
    })

    expect(inputs.versionInput).toBe("  v1.2.3  ")
  })
})
