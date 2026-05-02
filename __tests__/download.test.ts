import path from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Architecture } from "@/artifact/architecture"
import { Artifact } from "@/artifact/artifact"
import type { GitHub } from "@/utils/github"

type ReleaseAsset = {
  readonly id: number
  readonly name: string
  readonly url: string
  readonly browser_download_url: string
}

type ReleaseResponse = {
  readonly data: {
    readonly tag_name: string
    readonly assets: readonly ReleaseAsset[]
  }
}

type GetReleaseByTagRequest = {
  readonly owner: string
  readonly repo: string
  readonly tag: string
}

const infoMock = vi.fn<(message: string) => void>()
const debugMock = vi.fn<(message: string) => void>()
const isDebugMock = vi.fn<() => boolean>()
const downloadToolMock =
  vi.fn<(url: string, dest?: string, auth?: string, headers?: Record<string, string>) => Promise<string>>()
const extractTarMock = vi.fn<(file: string) => Promise<string>>()
const mkdirPMock = vi.fn<(dest: string) => Promise<void>>()
const mvMock = vi.fn<(source: string, dest: string) => Promise<void>>()
const homedirMock = vi.fn<() => string>()
const statSyncMock = vi.fn<(file: string) => { readonly size: number }>()
const getChecksumFromFileMock = vi.fn<(checksumFilePath: string, archiveName: string) => string>()
const getChecksumFromKnownListMock = vi.fn<(archiveName: string) => string | undefined>()
const verifyChecksumMock = vi.fn<(archivePath: string, expectedChecksum: string, archiveName: string) => void>()
const getReleaseByTagMock = vi.fn<(request: GetReleaseByTagRequest) => Promise<ReleaseResponse>>()

vi.doMock(
  "@actions/core",
  (): Record<string, unknown> => ({
    info: infoMock,
    debug: debugMock,
    isDebug: isDebugMock,
  }),
)

vi.doMock(
  "@actions/tool-cache",
  (): Record<string, unknown> => ({
    downloadTool: downloadToolMock,
    extractTar: extractTarMock,
  }),
)

vi.doMock(
  "@actions/io",
  (): Record<string, unknown> => ({
    mkdirP: mkdirPMock,
    mv: mvMock,
  }),
)

vi.doMock(
  "node:fs",
  (): Record<string, unknown> => ({
    statSync: statSyncMock,
  }),
)

vi.doMock(
  "node:os",
  (): Record<string, unknown> => ({
    homedir: homedirMock,
  }),
)

vi.doMock(
  "@/download/checksum",
  (): Record<string, unknown> => ({
    getChecksumFromFile: getChecksumFromFileMock,
    getChecksumFromKnownList: getChecksumFromKnownListMock,
    verifyChecksum: verifyChecksumMock,
  }),
)

const { downloadVersion }: typeof import("@/download/download-version") = await import("@/download/download-version")

const artifactVersion = "v1.2.3"
const downloadPath = "/tmp/acton.tar.gz"
const checksumPath = "/tmp/acton.tar.gz.sha256"
const fileChecksum = "a".repeat(64)
const knownChecksum = "b".repeat(64)
const extractedPath = "/tmp/extracted"
const homePath = "/home/test-user"
const installedPath = path.join(homePath, ".acton", "bin")
const extractedToolPath = path.join(extractedPath, "acton")
const expectedToolPath = path.join(installedPath, "acton")

function createGitHub(): GitHub {
  return {
    getOctokit: (): unknown => ({
      rest: {
        repos: {
          getReleaseByTag: getReleaseByTagMock,
        },
      },
    }),
    getAuthToken: (): string => "token test-token",
  } as unknown as GitHub
}

function createArtifact(): Artifact {
  return new Artifact("acton", artifactVersion, "x86_64", "linux")
}

function createReleaseAsset(version: string, architecture: Architecture, assetId: number): ReleaseAsset {
  const artifact = new Artifact("acton", version, architecture, "linux")

  return {
    id: assetId,
    name: artifact.archiveName,
    url: `https://api.github.com/repos/ton-blockchain/acton/releases/assets/${assetId}`,
    browser_download_url: `https://github.com/ton-blockchain/acton/releases/download/${version}/${artifact.archiveName}`,
  }
}

function createChecksumAsset(version: string, architecture: Architecture, assetId: number): ReleaseAsset {
  const artifact = new Artifact("acton", version, architecture, "linux")

  return {
    id: assetId,
    name: `${artifact.archiveName}.sha256`,
    url: `https://api.github.com/repos/ton-blockchain/acton/releases/assets/${assetId}`,
    browser_download_url: `https://github.com/ton-blockchain/acton/releases/download/${version}/${artifact.archiveName}.sha256`,
  }
}

function mockRelease(version: string, assets: readonly ReleaseAsset[]): void {
  getReleaseByTagMock.mockResolvedValue({
    data: {
      tag_name: version,
      assets,
    },
  })
}

describe("downloadVersion", (): void => {
  beforeEach((): void => {
    vi.clearAllMocks()

    isDebugMock.mockReturnValue(false)
    downloadToolMock.mockImplementation((url: string): Promise<string> => {
      if (url === "https://api.github.com/repos/ton-blockchain/acton/releases/assets/297813425") {
        return Promise.resolve(downloadPath)
      }

      if (url === "https://api.github.com/repos/ton-blockchain/acton/releases/assets/297813426") {
        return Promise.resolve(checksumPath)
      }

      return Promise.reject(new Error(`Unexpected download URL: ${url}`))
    })
    extractTarMock.mockResolvedValue(extractedPath)
    mkdirPMock.mockResolvedValue(undefined)
    mvMock.mockResolvedValue(undefined)
    homedirMock.mockReturnValue(homePath)
    getChecksumFromFileMock.mockReturnValue(fileChecksum)
    getChecksumFromKnownListMock.mockReturnValue(undefined)
    statSyncMock.mockReturnValue({ size: 42 })
    mockRelease(artifactVersion, [
      createReleaseAsset(artifactVersion, "aarch64", 297813424),
      createReleaseAsset(artifactVersion, "x86_64", 297813425),
      createChecksumAsset(artifactVersion, "x86_64", 297813426),
    ])
  })

  it("downloads the matching release checksum and toolchain assets through the GitHub API URL", async (): Promise<void> => {
    await expect(downloadVersion(createArtifact(), createGitHub())).resolves.toEqual({
      toolPath: expectedToolPath,
      useCache: false,
    })

    expect(getReleaseByTagMock).toHaveBeenCalledWith({
      owner: "ton-blockchain",
      repo: "acton",
      tag: artifactVersion,
    })
    expect(downloadToolMock).toHaveBeenNthCalledWith(
      1,
      "https://api.github.com/repos/ton-blockchain/acton/releases/assets/297813426",
      undefined,
      "token test-token",
      {
        accept: "application/octet-stream",
      },
    )
    expect(downloadToolMock).toHaveBeenNthCalledWith(
      2,
      "https://api.github.com/repos/ton-blockchain/acton/releases/assets/297813425",
      undefined,
      "token test-token",
      {
        accept: "application/octet-stream",
      },
    )
    expect(getChecksumFromKnownListMock).toHaveBeenCalledWith("acton-x86_64-unknown-linux-gnu-v1.2.3")
    expect(getChecksumFromFileMock).toHaveBeenCalledWith(checksumPath, "acton-x86_64-unknown-linux-gnu.tar.gz")
    expect(verifyChecksumMock).toHaveBeenCalledWith(downloadPath, fileChecksum, "acton-x86_64-unknown-linux-gnu.tar.gz")
    expect(extractTarMock).toHaveBeenCalledWith(downloadPath)
    expect(mkdirPMock).toHaveBeenCalledWith(installedPath)
    expect(mvMock).toHaveBeenCalledWith(extractedToolPath, installedPath)
  })

  it("uses a known checksum without downloading the release checksum asset", async (): Promise<void> => {
    getChecksumFromKnownListMock.mockReturnValue(knownChecksum)

    await expect(downloadVersion(createArtifact(), createGitHub())).resolves.toEqual({
      toolPath: expectedToolPath,
      useCache: false,
    })

    expect(downloadToolMock).toHaveBeenCalledTimes(1)
    expect(downloadToolMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/ton-blockchain/acton/releases/assets/297813425",
      undefined,
      "token test-token",
      {
        accept: "application/octet-stream",
      },
    )
    expect(getChecksumFromKnownListMock).toHaveBeenCalledWith("acton-x86_64-unknown-linux-gnu-v1.2.3")
    expect(getChecksumFromFileMock).not.toHaveBeenCalled()
    expect(verifyChecksumMock).toHaveBeenCalledWith(
      downloadPath,
      knownChecksum,
      "acton-x86_64-unknown-linux-gnu.tar.gz",
    )
    expect(extractTarMock).toHaveBeenCalledWith(downloadPath)
    expect(mkdirPMock).toHaveBeenCalledWith(installedPath)
    expect(mvMock).toHaveBeenCalledWith(extractedToolPath, installedPath)
  })

  it("fails before downloading when the expected asset is missing", async (): Promise<void> => {
    mockRelease(artifactVersion, [createReleaseAsset(artifactVersion, "aarch64", 297813424)])

    await expect(downloadVersion(createArtifact(), createGitHub())).rejects.toThrow(
      `Archive acton-x86_64-unknown-linux-gnu.tar.gz not found in release ${artifactVersion}`,
    )
    expect(downloadToolMock).not.toHaveBeenCalled()
    expect(getChecksumFromKnownListMock).not.toHaveBeenCalled()
    expect(verifyChecksumMock).not.toHaveBeenCalled()
    expect(extractTarMock).not.toHaveBeenCalled()
    expect(mkdirPMock).not.toHaveBeenCalled()
    expect(mvMock).not.toHaveBeenCalled()
  })

  it("fails before downloading when the expected checksum asset is missing", async (): Promise<void> => {
    mockRelease(artifactVersion, [
      createReleaseAsset(artifactVersion, "aarch64", 297813424),
      createReleaseAsset(artifactVersion, "x86_64", 297813425),
    ])

    await expect(downloadVersion(createArtifact(), createGitHub())).rejects.toThrow(
      `Checksum file acton-x86_64-unknown-linux-gnu.tar.gz.sha256 not found in release ${artifactVersion}`,
    )
    expect(downloadToolMock).not.toHaveBeenCalled()
    expect(getChecksumFromKnownListMock).not.toHaveBeenCalled()
    expect(getChecksumFromFileMock).not.toHaveBeenCalled()
    expect(verifyChecksumMock).not.toHaveBeenCalled()
    expect(extractTarMock).not.toHaveBeenCalled()
    expect(mkdirPMock).not.toHaveBeenCalled()
    expect(mvMock).not.toHaveBeenCalled()
  })

  it("fails before downloading the toolchain when the release checksum file cannot be parsed", async (): Promise<void> => {
    getChecksumFromFileMock.mockImplementationOnce((): string => {
      throw new Error("Checksum file is invalid")
    })

    await expect(downloadVersion(createArtifact(), createGitHub())).rejects.toThrow("Checksum file is invalid")
    expect(downloadToolMock).toHaveBeenCalledTimes(1)
    expect(downloadToolMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/ton-blockchain/acton/releases/assets/297813426",
      undefined,
      "token test-token",
      {
        accept: "application/octet-stream",
      },
    )
    expect(verifyChecksumMock).not.toHaveBeenCalled()
    expect(extractTarMock).not.toHaveBeenCalled()
    expect(mkdirPMock).not.toHaveBeenCalled()
    expect(mvMock).not.toHaveBeenCalled()
  })

  it("fails before extracting when checksum verification fails", async (): Promise<void> => {
    verifyChecksumMock.mockImplementationOnce((): void => {
      throw new Error("Checksum mismatch")
    })

    await expect(downloadVersion(createArtifact(), createGitHub())).rejects.toThrow("Checksum mismatch")
    expect(extractTarMock).not.toHaveBeenCalled()
    expect(mkdirPMock).not.toHaveBeenCalled()
    expect(mvMock).not.toHaveBeenCalled()
  })

  it("logs downloaded and extracted file sizes in debug mode", async (): Promise<void> => {
    isDebugMock.mockReturnValue(true)
    statSyncMock
      .mockReturnValueOnce({ size: 100 })
      .mockReturnValueOnce({ size: 200 })
      .mockReturnValueOnce({ size: 300 })

    await expect(downloadVersion(createArtifact(), createGitHub())).resolves.toEqual({
      toolPath: expectedToolPath,
      useCache: false,
    })

    expect(statSyncMock).toHaveBeenNthCalledWith(1, checksumPath)
    expect(statSyncMock).toHaveBeenNthCalledWith(2, downloadPath)
    expect(statSyncMock).toHaveBeenNthCalledWith(3, expectedToolPath)
    expect(debugMock).toHaveBeenCalledWith(`Downloaded ${checksumPath} with size 100`)
    expect(debugMock).toHaveBeenCalledWith(`Downloaded ${downloadPath} with size 200`)
    expect(debugMock).toHaveBeenCalledWith(`Extracted ${expectedToolPath} with size 300`)
  })
})
