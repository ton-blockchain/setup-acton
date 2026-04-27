import { afterEach, describe, expect, it } from "@jest/globals"
import { createHash } from "node:crypto"
import * as fs from "node:fs"
import * as os from "node:os"
import path from "node:path"
import { parseChecksum, verifyChecksum } from "@/download/checksum"

const artifactName = "acton-x86_64-unknown-linux-gnu.tar.gz"
const checksumAssetName = `${artifactName}.sha256`
const artifactContents = "artifact contents"
const artifactChecksum = createHash("sha256").update(artifactContents).digest("hex")

let tempDir: string | undefined

function writeTempFile(fileName: string, contents: string): string {
  tempDir ??= fs.mkdtempSync(path.join(os.tmpdir(), "setup-acton-checksum-"))

  const filePath = path.join(tempDir, fileName)
  fs.writeFileSync(filePath, contents)
  return filePath
}

function createArtifactFile(): string {
  return writeTempFile(artifactName, artifactContents)
}

afterEach((): void => {
  if (tempDir !== undefined) {
    fs.rmSync(tempDir, { force: true, recursive: true })
    tempDir = undefined
  }
})

describe("parseChecksum", (): void => {
  it("returns checksum and asset name from the first line", (): void => {
    expect(parseChecksum(`${artifactChecksum}  ${artifactName}\n`)).toEqual({
      checksum: artifactChecksum,
      assetName: artifactName,
    })
  })

  it("fails when the first line does not contain exactly two parts", (): void => {
    expect((): void => {
      parseChecksum(`${artifactChecksum}\n`)
    }).toThrow("Checksum file must use '<sha256>  <asset name>' format")
  })

  it("fails when the first line uses one space between checksum and asset name", (): void => {
    expect((): void => {
      parseChecksum(`${artifactChecksum} ${artifactName}\n`)
    }).toThrow("Checksum file must use '<sha256>  <asset name>' format")
  })
})

describe("verifyChecksum", (): void => {
  it("verifies a checksum file with a matching artifact name", (): void => {
    const downloadPath = createArtifactFile()
    const checksumPath = writeTempFile(checksumAssetName, `${artifactChecksum}  ${artifactName}\n`)

    expect((): void => verifyChecksum(downloadPath, checksumPath, artifactName)).not.toThrow()
  })

  it("does not search for checksums beyond the first line", (): void => {
    const downloadPath = createArtifactFile()
    const checksumPath = writeTempFile(checksumAssetName, `not-a-checksum\n${artifactChecksum}  ${artifactName}\n`)

    expect((): void => verifyChecksum(downloadPath, checksumPath, artifactName)).toThrow(
      "Checksum file must use '<sha256>  <asset name>' format",
    )
  })

  it("fails when the checksum does not match", (): void => {
    const downloadPath = createArtifactFile()
    const wrongChecksum = "0".repeat(64)
    const checksumPath = writeTempFile(checksumAssetName, `${wrongChecksum}  ${artifactName}\n`)

    expect((): void => verifyChecksum(downloadPath, checksumPath, artifactName)).toThrow(
      `Checksum mismatch for ${artifactName}: expected ${wrongChecksum}, got ${artifactChecksum}`,
    )
  })

  it("fails before checking the checksum when the asset name does not match", (): void => {
    const downloadPath = createArtifactFile()
    const wrongChecksum = "0".repeat(64)
    const checksumPath = writeTempFile(checksumAssetName, `${wrongChecksum}  other-artifact.tar.gz\n`)

    expect((): void => verifyChecksum(downloadPath, checksumPath, artifactName)).toThrow(
      `Checksum asset name mismatch: expected ${artifactName}, got other-artifact.tar.gz`,
    )
  })

  it("fails when the checksum file is empty", (): void => {
    const downloadPath = createArtifactFile()
    const checksumPath = writeTempFile(checksumAssetName, "\n")

    expect((): void => verifyChecksum(downloadPath, checksumPath, artifactName)).toThrow(
      "Checksum file does not contain a checksum",
    )
  })
})
