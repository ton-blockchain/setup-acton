import { beforeEach, describe, expect, it, vi } from "vitest"

const toolPath = "/tmp/setup-acton/bin/acton"
const addPathMock = vi.fn<(path: string) => void>()
const debugMock = vi.fn<(message: string) => void>()
const infoMock = vi.fn<(message: string) => void>()
const setFailedMock = vi.fn<(message: string | Error) => void>()
const setOutputMock = vi.fn<(name: string, value: unknown) => void>()
const resolveVersionMock = vi.fn<(inputVersion: string, workspacePath: string, github: unknown) => Promise<string>>()
const saveCacheInputMock = vi.fn<() => boolean>()
const resolveToolchainMock =
  vi.fn<
    (
      artifact: unknown,
      cache: unknown,
      github: unknown,
    ) => Promise<{ readonly toolPath: string; readonly useCache: boolean }>
  >()
const getInstalledActonVersionMock = vi.fn<(actonPath: string) => Promise<string>>()

vi.doMock(
  "@actions/core",
  (): Record<string, unknown> => ({
    addPath: addPathMock,
    debug: debugMock,
    info: infoMock,
    setFailed: setFailedMock,
    setOutput: setOutputMock,
  }),
)

vi.doMock(
  "@/utils/inputs",
  (): Record<string, unknown> => ({
    versionInput: "v1.2.3",
    architectureInput: "x86_64",
    platformInput: "linux",
    workingDirectoryInput: "contracts",
    githubTokenInput: "ghs_test",
    saveCacheInput: saveCacheInputMock,
  }),
)

vi.doMock(
  "@/utils/github",
  (): Record<string, unknown> => ({
    GitHub: class GitHubMock {
      public readonly token: string

      public constructor(token: string) {
        this.token = token
      }
    },
  }),
)

vi.doMock(
  "@/version/resolve",
  (): Record<string, unknown> => ({
    resolveVersion: resolveVersionMock,
  }),
)

vi.doMock(
  "@/download/download-version",
  (): Record<string, unknown> => ({
    resolveToolchain: resolveToolchainMock,
  }),
)

vi.doMock(
  "@/version/acton-version",
  (): Record<string, unknown> => ({
    getInstalledActonVersion: getInstalledActonVersionMock,
  }),
)

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
    saveCacheInputMock.mockReturnValue(false)
    resolveVersionMock.mockResolvedValue("v1.2.3")
    resolveToolchainMock.mockResolvedValue({ toolPath, useCache: false })
    getInstalledActonVersionMock.mockResolvedValue("1.2.3")
  })

  it("logs a successful completion message after setting outputs", async (): Promise<void> => {
    await importSetupActon()

    expect(resolveVersionMock).toHaveBeenCalledWith("v1.2.3", "contracts", expect.anything())
    expect(addPathMock).toHaveBeenCalledWith("/tmp/setup-acton/bin")
    expect(setOutputMock).toHaveBeenCalledWith("acton-path", toolPath)
    expect(setOutputMock).toHaveBeenCalledWith("acton-version", "1.2.3")
    expect(setOutputMock).toHaveBeenCalledWith("cache-hit", false)
    expect(infoMock).toHaveBeenCalledWith("Successfully installed Acton version 1.2.3")
    expect(infoMock.mock.invocationCallOrder[0]).toBeGreaterThan(setOutputMock.mock.invocationCallOrder.at(-1) ?? 0)
    expect(setFailedMock).not.toHaveBeenCalled()
  })
})
