import { beforeEach, describe, expect, it, jest } from "@jest/globals"
import path from "node:path"
import { Artifact } from "../src/artifact"
import type { Architecture } from "../src/architecture"
import type { GitHub } from "../src/github"

type ReleaseAsset = {
  readonly name: string
  readonly url: string
  readonly browser_download_url: string
}

type ReleaseResponse = {
  readonly data: {
    readonly tag_name: string
    readonly assets: ReadonlyArray<ReleaseAsset>
  }
}

type GetReleaseByTagRequest = {
  readonly owner: string
  readonly repo: string
  readonly tag: string
}

const infoMock = jest.fn<(message: string) => void>()
const debugMock = jest.fn<(message: string) => void>()
const isDebugMock = jest.fn<() => boolean>()
const downloadToolMock =
  jest.fn<(url: string, dest?: string, auth?: string, headers?: Record<string, string>) => Promise<string>>()
const extractTarMock = jest.fn<(file: string) => Promise<string>>()
const statSyncMock = jest.fn<(file: string) => { readonly size: number }>()
const getReleaseByTagMock = jest.fn<(request: GetReleaseByTagRequest) => Promise<ReleaseResponse>>()

jest.unstable_mockModule("@actions/core", (): Record<string, unknown> => {
  return {
    info: infoMock,
    debug: debugMock,
    isDebug: isDebugMock,
  }
})

jest.unstable_mockModule("@actions/tool-cache", (): Record<string, unknown> => {
  return {
    downloadTool: downloadToolMock,
    extractTar: extractTarMock,
  }
})

jest.unstable_mockModule("node:fs", (): Record<string, unknown> => {
  return {
    statSync: statSyncMock,
  }
})

const { downloadVersion } = await import("../src/download")

const artifactVersion = "v1.2.3"
const downloadPath = "/tmp/acton.tar.gz"
const extractedPath = "/tmp/extracted"
const expectedToolPath = path.join(extractedPath, "acton")

function createGitHub(): GitHub {
  return {
    getOctokit: (): unknown => {
      return {
        rest: {
          repos: {
            getReleaseByTag: getReleaseByTagMock,
          },
        },
      }
    },
    getAuthToken: (): string => "token test-token",
  } as unknown as GitHub
}

function createArtifact(): Artifact {
  return new Artifact("acton", artifactVersion, "linux", "x86_64")
}

function createReleaseAsset(version: string, architecture: Architecture): ReleaseAsset {
  const artifact = new Artifact("acton", version, "linux", architecture)

  return {
    name: artifact.artifactName,
    url: `https://api.github.test/releases/${version}/assets/${architecture}`,
    browser_download_url: `https://github.test/ton-blockchain/acton/releases/download/${version}/${artifact.artifactName}`,
  }
}

function mockRelease(version: string, assets: ReadonlyArray<ReleaseAsset>): void {
  getReleaseByTagMock.mockResolvedValue({
    data: {
      tag_name: version,
      assets,
    },
  })
}

describe("downloadVersion", (): void => {
  beforeEach((): void => {
    jest.clearAllMocks()

    isDebugMock.mockReturnValue(false)
    downloadToolMock.mockResolvedValue(downloadPath)
    extractTarMock.mockResolvedValue(extractedPath)
    statSyncMock.mockReturnValue({ size: 42 })
    mockRelease(artifactVersion, [
      createReleaseAsset(artifactVersion, "aarch64"),
      createReleaseAsset(artifactVersion, "x86_64"),
    ])
  })

  it("downloads the matching release asset through the GitHub API URL", async (): Promise<void> => {
    await expect(downloadVersion(createArtifact(), createGitHub())).resolves.toEqual({ toolPath: expectedToolPath })

    expect(getReleaseByTagMock).toHaveBeenCalledWith({
      owner: "ton-blockchain",
      repo: "acton",
      tag: artifactVersion,
    })
    expect(downloadToolMock).toHaveBeenCalledWith(
      `https://api.github.test/releases/${artifactVersion}/assets/x86_64`,
      undefined,
      "token test-token",
      {
        accept: "application/octet-stream",
      },
    )
    expect(extractTarMock).toHaveBeenCalledWith(downloadPath)
  })

  it("fails before downloading when the expected asset is missing", async (): Promise<void> => {
    mockRelease(artifactVersion, [createReleaseAsset(artifactVersion, "aarch64")])

    await expect(downloadVersion(createArtifact(), createGitHub())).rejects.toThrow(
      `Asset acton-x86_64-unknown-linux-gnu.tar.gz in release ${artifactVersion} not found`,
    )
    expect(downloadToolMock).not.toHaveBeenCalled()
    expect(extractTarMock).not.toHaveBeenCalled()
  })

  it("logs downloaded and extracted file sizes in debug mode", async (): Promise<void> => {
    isDebugMock.mockReturnValue(true)
    statSyncMock.mockReturnValueOnce({ size: 100 }).mockReturnValueOnce({ size: 200 })

    await expect(downloadVersion(createArtifact(), createGitHub())).resolves.toEqual({ toolPath: expectedToolPath })

    expect(statSyncMock).toHaveBeenNthCalledWith(1, downloadPath)
    expect(statSyncMock).toHaveBeenNthCalledWith(2, expectedToolPath)
    expect(debugMock).toHaveBeenCalledWith(`Downloaded ${downloadPath} with size 100`)
    expect(debugMock).toHaveBeenCalledWith(`Extracted ${expectedToolPath} with size 200`)
  })
})
