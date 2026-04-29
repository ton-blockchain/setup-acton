import { beforeEach, describe, expect, it, vi } from "vitest"

type ExecOutput = {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

const getExecOutputMock =
  vi.fn<(commandLine: string, args?: string[], options?: Record<string, unknown>) => Promise<ExecOutput>>()
const debugMock = vi.fn<(message: string) => void>()

vi.doMock(
  "@actions/core",
  (): Record<string, unknown> => ({
    debug: debugMock,
  }),
)

vi.doMock(
  "@actions/exec",
  (): Record<string, unknown> => ({
    getExecOutput: getExecOutputMock,
  }),
)

const { getInstalledActonVersion, parseActonVersion }: typeof import("@/version/acton-version") = await import(
  "@/version/acton-version"
)

describe("parseActonVersion", (): void => {
  it.each([
    ["acton 0.3.1 (2f13f9b85 2026-04-26)", "0.3.1"],
    ["acton 0.3.1-trunk (2c68e96 2026-04-26)", "0.3.1-trunk"],
    ["acton 0.3.1\n", "0.3.1"],
  ] as const)("parses %s as %s", (output, expectedVersion): void => {
    expect(parseActonVersion(output)).toBe(expectedVersion)
  })

  it("fails when the output does not contain an Acton version", (): void => {
    expect((): string => parseActonVersion("unexpected output")).toThrow(
      'Unable to parse Acton version from output: "unexpected output"',
    )
  })
})

describe("getInstalledActonVersion", (): void => {
  beforeEach((): void => {
    vi.clearAllMocks()
  })

  it("runs the installed Acton binary silently through @actions/exec", async (): Promise<void> => {
    getExecOutputMock.mockResolvedValue({
      exitCode: 0,
      stdout: "acton 0.3.1 (2f13f9b85 2026-04-26)\n",
      stderr: "",
    })

    await expect(getInstalledActonVersion("/tmp/acton")).resolves.toBe("0.3.1")

    expect(getExecOutputMock).toHaveBeenCalledWith("/tmp/acton", ["--version"], {
      silent: true,
    })
  })

  it("parses stdout only", async (): Promise<void> => {
    getExecOutputMock.mockResolvedValue({
      exitCode: 0,
      stdout: "acton 0.3.1-trunk (2c68e96 2026-04-26)\n",
      stderr: "unexpected stderr output",
    })

    await expect(getInstalledActonVersion("/tmp/acton")).resolves.toBe("0.3.1-trunk")
  })

  it("logs debug context and falls back to unknown when the installed version cannot be fetched", async (): Promise<void> => {
    getExecOutputMock.mockRejectedValue(new Error("acton unavailable"))

    await expect(getInstalledActonVersion("/tmp/acton")).resolves.toBe("unknown")

    expect(debugMock).toHaveBeenCalledWith("Failed to get installed Acton version: acton unavailable")
  })

  it("logs debug context and falls back to unknown when the installed version cannot be parsed", async (): Promise<void> => {
    getExecOutputMock.mockResolvedValue({
      exitCode: 0,
      stdout: "unexpected output",
      stderr: "",
    })

    await expect(getInstalledActonVersion("/tmp/acton")).resolves.toBe("unknown")

    expect(debugMock).toHaveBeenCalledWith(
      'Failed to get installed Acton version: Unable to parse Acton version from output: "unexpected output"',
    )
  })
})
