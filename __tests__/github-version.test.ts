import * as fs from "node:fs"
import * as os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { GitHub } from "@/utils/github"

type LatestReleaseResponse = {
  readonly data: {
    readonly tag_name: string
  }
}

type GetLatestReleaseRequest = {
  readonly owner: string
  readonly repo: string
}

const getLatestReleaseMock = vi.fn<(request: GetLatestReleaseRequest) => Promise<LatestReleaseResponse>>()
const debugMock = vi.fn<(message: string) => void>()

vi.doMock(
  "@actions/core",
  (): Record<string, unknown> => ({
    debug: debugMock,
  }),
)

const { resolveVersion }: typeof import("@/version/resolve") = await import("@/version/resolve")

let tempDir: string | undefined

function createTempDir(): string {
  tempDir ??= fs.mkdtempSync(path.join(os.tmpdir(), "setup-acton-resolve-"))
  return tempDir
}

function writeActonToml(contents: string): string {
  const workspacePath = createTempDir()
  fs.writeFileSync(path.join(workspacePath, "Acton.toml"), contents)
  return workspacePath
}

function createGitHub(): GitHub {
  return {
    getOctokit: (): unknown => ({
      rest: {
        repos: {
          getLatestRelease: getLatestReleaseMock,
        },
      },
    }),
  } as unknown as GitHub
}

describe("resolveVersion", (): void => {
  afterEach((): void => {
    if (tempDir !== undefined) {
      fs.rmSync(tempDir, { force: true, recursive: true })
      tempDir = undefined
    }
  })

  beforeEach((): void => {
    vi.clearAllMocks()

    getLatestReleaseMock.mockResolvedValue({
      data: {
        tag_name: "v1.2.3",
      },
    })
  })

  it.each([
    ["1.2.3", "v1.2.3"],
    ["0.1.11", "v0.1.11"],
    ["v1.2.3", "v1.2.3"],
    ["trunk", "trunk"],
  ] as const)("normalizes %s to %s without calling GitHub", async (inputVersion, expectedVersion): Promise<void> => {
    await expect(resolveVersion(inputVersion, "", createGitHub())).resolves.toBe(expectedVersion)

    expect(getLatestReleaseMock).not.toHaveBeenCalled()
    expect(debugMock).not.toHaveBeenCalled()
  })

  it("resolves latest from the GitHub latest release", async (): Promise<void> => {
    await expect(resolveVersion("latest", "", createGitHub())).resolves.toBe("v1.2.3")

    expect(getLatestReleaseMock).toHaveBeenCalledWith({
      owner: "ton-blockchain",
      repo: "acton",
    })
    expect(debugMock).toHaveBeenCalledWith("Fetching latest version from GitHub...")
  })

  it("resolves the version from Acton.toml when input version is empty", async (): Promise<void> => {
    const workspacePath = writeActonToml(`
[toolchain]
acton = "0.3.2"
`)

    await expect(resolveVersion("", workspacePath, createGitHub())).resolves.toBe("v0.3.2")

    expect(getLatestReleaseMock).not.toHaveBeenCalled()
    expect(debugMock).not.toHaveBeenCalled()
  })

  it("resolves latest from GitHub when input version is empty and Acton.toml has no version", async (): Promise<void> => {
    await expect(resolveVersion("", createTempDir(), createGitHub())).resolves.toBe("v1.2.3")

    expect(getLatestReleaseMock).toHaveBeenCalledWith({
      owner: "ton-blockchain",
      repo: "acton",
    })
    expect(debugMock).toHaveBeenCalledWith("Fetching latest version from GitHub...")
  })

  it("propagates errors when latest version cannot be fetched", async (): Promise<void> => {
    const error = new Error("GitHub API unavailable")
    getLatestReleaseMock.mockRejectedValue(error)

    await expect(resolveVersion("latest", "", createGitHub())).rejects.toThrow("GitHub API unavailable")

    expect(debugMock).toHaveBeenCalledWith("Fetching latest version from GitHub...")
  })
})
