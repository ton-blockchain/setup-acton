import { beforeEach, describe, expect, it, vi } from "vitest"

const toolPath = "/tmp/setup-acton/bin/acton"
const addPathMock = vi.fn<(path: string) => void>()
const debugMock = vi.fn<(message: string) => void>()
const infoMock = vi.fn<(message: string) => void>()
const setFailedMock = vi.fn<(message: string | Error) => void>()
const setOutputMock = vi.fn<(name: string, value: string) => void>()
const resolveVersionMock = vi.fn<(inputVersion: string, github: unknown) => Promise<string>>()
const downloadVersionMock = vi.fn<(artifact: unknown, github: unknown) => Promise<{ readonly toolPath: string }>>()
const getInstalledActonVersionMock = vi.fn<(actonPath: string) => Promise<string>>()

vi.doMock("@actions/core", (): Record<string, unknown> => {
  return {
    addPath: addPathMock,
    debug: debugMock,
    info: infoMock,
    setFailed: setFailedMock,
    setOutput: setOutputMock,
  }
})

vi.doMock("@/utils/inputs", (): Record<string, unknown> => {
  return {
    architectureInput: "x86_64",
    getActonVersion: (): string => "v1.2.3",
    githubTokenInput: "ghs_test",
    platformInput: "linux",
  }
})

vi.doMock("@/utils/github", (): Record<string, unknown> => {
  return {
    GitHub: class GitHubMock {
      public readonly token: string

      public constructor(token: string) {
        this.token = token
      }
    },
  }
})

vi.doMock("@/version/tag-version", (): Record<string, unknown> => {
  return {
    resolveVersion: resolveVersionMock,
  }
})

vi.doMock("@/download/download-version", (): Record<string, unknown> => {
  return {
    downloadVersion: downloadVersionMock,
  }
})

vi.doMock("@/version/acton-version", (): Record<string, unknown> => {
  return {
    getInstalledActonVersion: getInstalledActonVersionMock,
  }
})

async function importSetupActon(): Promise<void> {
  vi.resetModules()
  await import("@/setup-acton")
  await new Promise<void>((resolve): void => {
    setImmediate(resolve)
  })
}

describe("setup-acton entrypoint", (): void => {
  beforeEach((): void => {
    vi.clearAllMocks()
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
