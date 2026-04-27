import { beforeEach, describe, expect, it, jest } from "@jest/globals"
import type * as inputsModule from "@/utils/inputs"

type InputsModule = typeof inputsModule

const getInputMock = jest.fn<(name: string, options?: Record<string, unknown>) => string>()

jest.unstable_mockModule("@actions/core", (): Record<string, unknown> => {
  return {
    getInput: getInputMock,
  }
})

async function importInputs(inputValues: Readonly<Record<string, string>> = {}): Promise<InputsModule> {
  jest.resetModules()
  getInputMock.mockReset()
  getInputMock.mockImplementation((name: string): string => {
    return inputValues[name] ?? ""
  })

  return import("@/utils/inputs")
}

describe("inputs", (): void => {
  beforeEach((): void => {
    getInputMock.mockReset()
  })

  it("reads top-level action inputs on module load", async (): Promise<void> => {
    const inputs = await importInputs({
      architecture: "aarch64",
      "github-token": "ghs_test",
      platform: "linux",
    })

    expect(inputs.githubTokenInput).toBe("ghs_test")
    expect(inputs.architectureInput).toBe("aarch64")
    expect(inputs.platformInput).toBe("linux")
    expect(getInputMock).toHaveBeenCalledWith("github-token", { required: true })
    expect(getInputMock).toHaveBeenCalledWith("architecture")
    expect(getInputMock).toHaveBeenCalledWith("platform")
  })

  it("uses empty strings for optional top-level inputs when they are not provided", async (): Promise<void> => {
    const inputs = await importInputs({
      "github-token": "ghs_test",
    })

    expect(inputs.githubTokenInput).toBe("ghs_test")
    expect(inputs.architectureInput).toBe("")
    expect(inputs.platformInput).toBe("")
  })

  it.each([["v1.2.3"], ["1.2.3"], ["latest"], ["trunk"], ["0.3.1-trunk"]] as const)(
    "reads the version input value %s",
    async (version): Promise<void> => {
      const inputs = await importInputs({
        version,
      })

      expect(inputs.getActonVersion()).toBe(version)
      expect(getInputMock).toHaveBeenCalledWith("version")
      expect(getInputMock).not.toHaveBeenCalledWith("acton-version")
    },
  )

  it("defaults to latest when the version input is empty", async (): Promise<void> => {
    const inputs = await importInputs()

    expect(inputs.getActonVersion()).toBe("latest")
    expect(getInputMock).toHaveBeenCalledWith("version")
  })

  it("does not trim the version input", async (): Promise<void> => {
    const inputs = await importInputs({
      version: "  v1.2.3  ",
    })

    expect(inputs.getActonVersion()).toBe("  v1.2.3  ")
  })
})
