import { beforeEach, describe, expect, it, vi } from "vitest"
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

const { getLatestVersion }: typeof import("@/version/github-version") = await import("@/version/github-version")

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

describe("getLatestVersion", (): void => {
  beforeEach((): void => {
    vi.clearAllMocks()

    getLatestReleaseMock.mockResolvedValue({
      data: {
        tag_name: "v1.2.3",
      },
    })
  })

  it("gets the latest version from the GitHub latest release", async (): Promise<void> => {
    await expect(getLatestVersion(createGitHub())).resolves.toBe("v1.2.3")

    expect(getLatestReleaseMock).toHaveBeenCalledWith({
      owner: "ton-blockchain",
      repo: "acton",
    })
    expect(debugMock).toHaveBeenCalledWith("Fetching latest version from GitHub...")
    expect(debugMock).toHaveBeenCalledWith("Fetched latest Acton release: v1.2.3")
  })

  it("propagates errors when the latest release cannot be fetched", async (): Promise<void> => {
    const error = new Error("GitHub API unavailable")
    getLatestReleaseMock.mockRejectedValue(error)

    await expect(getLatestVersion(createGitHub())).rejects.toThrow("GitHub API unavailable")

    expect(debugMock).toHaveBeenCalledWith("Fetching latest version from GitHub...")
    expect(debugMock).not.toHaveBeenCalledWith("Fetched latest Acton release: v1.2.3")
  })
})
