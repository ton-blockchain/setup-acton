import { beforeEach, describe, expect, it, jest } from "@jest/globals"

const toolPath = "/tmp/setup-acton/bin/acton"
const addPathMock = jest.fn<(path: string) => void>()
const debugMock = jest.fn<(message: string) => void>()
const infoMock = jest.fn<(message: string) => void>()
const setFailedMock = jest.fn<(message: string | Error) => void>()
const setOutputMock = jest.fn<(name: string, value: string) => void>()
const resolveVersionMock = jest.fn<(inputVersion: string, github: unknown) => Promise<string>>()
const downloadVersionMock = jest.fn<(artifact: unknown, github: unknown) => Promise<{ readonly toolPath: string }>>()
const getInstalledActonVersionMock = jest.fn<(toolPath: string) => Promise<string>>()

jest.unstable_mockModule("@actions/core", (): Record<string, unknown> => {
  return {
    addPath: addPathMock,
    debug: debugMock,
    info: infoMock,
    setFailed: setFailedMock,
    setOutput: setOutputMock,
  }
})

jest.unstable_mockModule("@/utils/inputs", (): Record<string, unknown> => {
  return {
    architectureInput: "x86_64",
    getActonVersion: (): string => "v1.2.3",
    githubTokenInput: "ghs_test",
    platformInput: "linux",
  }
})

jest.unstable_mockModule("@/utils/github", (): Record<string, unknown> => {
  return {
    GitHub: class GitHubMock {
      public readonly token: string

      public constructor(token: string) {
        this.token = token
      }
    },
  }
})

jest.unstable_mockModule("@/version/tag-version", (): Record<string, unknown> => {
  return {
    resolveVersion: resolveVersionMock,
  }
})

jest.unstable_mockModule("@/download/download-version", (): Record<string, unknown> => {
  return {
    downloadVersion: downloadVersionMock,
  }
})

jest.unstable_mockModule("@/version/acton-version", (): Record<string, unknown> => {
  return {
    getInstalledActonVersion: getInstalledActonVersionMock,
  }
})

async function importSetupActon(): Promise<void> {
  jest.resetModules()
  await import("@/setup-acton")
  await new Promise<void>((resolve): void => {
    setImmediate(resolve)
  })
}

describe("setup-acton entrypoint", (): void => {
  beforeEach((): void => {
    jest.clearAllMocks()
    resolveVersionMock.mockResolvedValue("v1.2.3")
    downloadVersionMock.mockResolvedValue({ toolPath })
    getInstalledActonVersionMock.mockResolvedValue("1.2.3")
  })

  it("logs a successful completion message after setting outputs", async (): Promise<void> => {
    await importSetupActon()

    expect(addPathMock).toHaveBeenCalledWith("/tmp/setup-acton/bin")
    expect(setOutputMock).toHaveBeenCalledWith("acton-path", toolPath)
    expect(setOutputMock).toHaveBeenCalledWith("acton-version", "1.2.3")
    expect(infoMock).toHaveBeenCalledWith("Successfully installed Acton version 1.2.3")
    expect(infoMock.mock.invocationCallOrder[0]).toBeGreaterThan(setOutputMock.mock.invocationCallOrder.at(-1) ?? 0)
    expect(setFailedMock).not.toHaveBeenCalled()
  })
})
