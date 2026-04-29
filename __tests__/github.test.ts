import { beforeEach, describe, expect, it, vi } from "vitest"
import type * as githubModule from "@/utils/github"

type GitHubModule = typeof githubModule

type OctokitMock = {
  readonly rest: {
    readonly repos: Record<string, never>
  }
}

const octokitMock: OctokitMock = {
  rest: {
    repos: {},
  },
}
const getOctokitMock = vi.fn<(token: string) => OctokitMock>()

vi.doMock(
  "@actions/github",
  (): Record<string, unknown> => ({
    getOctokit: getOctokitMock,
  }),
)

const { GitHub } = (await import("@/utils/github")) as GitHubModule

describe("GitHub", (): void => {
  beforeEach((): void => {
    vi.clearAllMocks()
    getOctokitMock.mockReturnValue(octokitMock)
  })

  it("creates an Octokit client with the provided token", (): void => {
    const github = new GitHub("ghs_test")

    expect(getOctokitMock).toHaveBeenCalledWith("ghs_test")
    expect(github.getOctokit()).toBe(octokitMock)
  })

  it("formats the token for GitHub asset downloads", (): void => {
    const github = new GitHub("ghs_test")

    expect(github.getAuthToken()).toBe("token ghs_test")
  })
})
