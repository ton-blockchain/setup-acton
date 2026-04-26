import { beforeEach, describe, expect, it, jest } from "@jest/globals"
import type { GitHub } from "@/github"

type LatestReleaseResponse = {
  readonly data: {
    readonly tag_name: string
  }
}

type GetLatestReleaseRequest = {
  readonly owner: string
  readonly repo: string
}

const getLatestReleaseMock = jest.fn<(request: GetLatestReleaseRequest) => Promise<LatestReleaseResponse>>()
const debugMock = jest.fn<(message: string) => void>()

jest.unstable_mockModule("@actions/core", (): Record<string, unknown> => {
  return {
    debug: debugMock,
  }
})

const { resolveVersion } = await import("@/version/tag-version")

function createGitHub(): GitHub {
  return {
    getOctokit: (): unknown => {
      return {
        rest: {
          repos: {
            getLatestRelease: getLatestReleaseMock,
          },
        },
      }
    },
  } as unknown as GitHub
}

describe("resolveVersion", (): void => {
  beforeEach((): void => {
    jest.clearAllMocks()

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
    await expect(resolveVersion(inputVersion, createGitHub())).resolves.toBe(expectedVersion)

    expect(getLatestReleaseMock).not.toHaveBeenCalled()
    expect(debugMock).not.toHaveBeenCalled()
  })

  it("resolves latest from the GitHub latest release", async (): Promise<void> => {
    await expect(resolveVersion("latest", createGitHub())).resolves.toBe("v1.2.3")

    expect(getLatestReleaseMock).toHaveBeenCalledWith({
      owner: "ton-blockchain",
      repo: "acton",
    })
    expect(debugMock).toHaveBeenCalledWith("Fetching latest version from GitHub...")
  })
})
