import { beforeEach, describe, expect, it, vi } from "vitest"

const toolPath = "/tmp/setup-acton/bin/acton"
const addPathMock = vi.fn<(path: string) => void>()
const debugMock = vi.fn<(message: string) => void>()
const infoMock = vi.fn<(message: string) => void>()
const setFailedMock = vi.fn<(message: string | Error) => void>()
const setOutputMock = vi.fn<(name: string, value: string) => void>()
const resolveVersionMock = vi.fn<(inputVersion: string, workspacePath: string, github: unknown) => Promise<string>>()
const downloadVersionMock = vi.fn<(artifact: unknown, github: unknown) => Promise<{ readonly toolPath: string }>>()
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
    downloadVersion: downloadVersionMock,
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
    resolveVersionMock.mockResolvedValue("v1.2.3")
    downloadVersionMock.mockResolvedValue({ toolPath })
    getInstalledActonVersionMock.mockResolvedValue("1.2.3")
  })

  it("logs a successful completion message after setting outputs", async (): Promise<void> => {
    await importSetupActon()

    expect(resolveVersionMock).toHaveBeenCalledWith("v1.2.3", "contracts", expect.anything())
    expect(addPathMock).toHaveBeenCalledWith("/tmp/setup-acton/bin")
    expect(setOutputMock).toHaveBeenCalledWith("acton-path", toolPath)
    expect(setOutputMock).toHaveBeenCalledWith("acton-version", "1.2.3")
    expect(infoMock).toHaveBeenCalledWith("Successfully installed Acton version 1.2.3")
    expect(infoMock.mock.invocationCallOrder[0]).toBeGreaterThan(setOutputMock.mock.invocationCallOrder.at(-1) ?? 0)
    expect(setFailedMock).not.toHaveBeenCalled()
  })
})
