import { beforeEach, describe, expect, it, vi } from "vitest"
import type { GitHub } from "@/utils/github"

const getLatestVersionMock = vi.fn<(github: GitHub) => Promise<string>>()
const readActonTomlVersionMock = vi.fn<(workspacePath: string) => string | undefined>()

vi.doMock(
  "@/version/github-version",
  (): Record<string, unknown> => ({
    getLatestVersion: getLatestVersionMock,
  }),
)

vi.doMock(
  "@/version/acton-toml-version",
  (): Record<string, unknown> => ({
    readActonTomlVersion: readActonTomlVersionMock,
  }),
)

const { resolveVersion }: typeof import("@/version/resolve") = await import("@/version/resolve")

const github = {} as GitHub
const workspacePath = "/workspace"

describe("resolveVersion", (): void => {
  beforeEach((): void => {
    vi.clearAllMocks()

    getLatestVersionMock.mockResolvedValue("v1.2.3")
    readActonTomlVersionMock.mockReturnValue(undefined)
  })

  it.each([
    ["1.2.3", "v1.2.3"],
    ["0.1.11", "v0.1.11"],
    ["v1.2.3", "v1.2.3"],
    ["trunk", "trunk"],
  ] as const)("normalizes %s to %s without reading fallback versions", async (inputVersion, expectedVersion): Promise<void> => {
    await expect(resolveVersion(inputVersion, workspacePath, github)).resolves.toBe(expectedVersion)

    expect(readActonTomlVersionMock).not.toHaveBeenCalled()
    expect(getLatestVersionMock).not.toHaveBeenCalled()
  })

  it("resolves latest from GitHub when input version is latest", async (): Promise<void> => {
    await expect(resolveVersion("latest", workspacePath, github)).resolves.toBe("v1.2.3")

    expect(readActonTomlVersionMock).not.toHaveBeenCalled()
    expect(getLatestVersionMock).toHaveBeenCalledWith(github)
  })

  it("resolves the version from Acton.toml when input version is empty", async (): Promise<void> => {
    readActonTomlVersionMock.mockReturnValue("0.3.2")

    await expect(resolveVersion("", workspacePath, github)).resolves.toBe("v0.3.2")

    expect(readActonTomlVersionMock).toHaveBeenCalledWith(workspacePath)
    expect(getLatestVersionMock).not.toHaveBeenCalled()
  })

  it("resolves latest from GitHub when input version is empty and Acton.toml has no version", async (): Promise<void> => {
    await expect(resolveVersion("", workspacePath, github)).resolves.toBe("v1.2.3")

    expect(readActonTomlVersionMock).toHaveBeenCalledWith(workspacePath)
    expect(getLatestVersionMock).toHaveBeenCalledWith(github)
  })

  it("propagates errors when latest version cannot be fetched", async (): Promise<void> => {
    const error = new Error("GitHub API unavailable")
    getLatestVersionMock.mockRejectedValue(error)

    await expect(resolveVersion("latest", workspacePath, github)).rejects.toThrow("GitHub API unavailable")

    expect(readActonTomlVersionMock).not.toHaveBeenCalled()
    expect(getLatestVersionMock).toHaveBeenCalledWith(github)
  })
})
