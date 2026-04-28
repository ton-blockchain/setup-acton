import { createHash } from "node:crypto"
import * as fs from "node:fs"
import * as os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { getChecksumFromFile, getChecksumFromKnownList, parseChecksum, verifyChecksum } from "@/download/checksum"

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

describe("getChecksumFromFile", (): void => {
  it("returns a checksum from a file with a matching artifact name", (): void => {
    const checksumPath = writeTempFile(checksumAssetName, `${artifactChecksum}  ${artifactName}\n`)

    expect(getChecksumFromFile(checksumPath, artifactName)).toBe(artifactChecksum)
  })

  it("does not search for checksums beyond the first line", (): void => {
    const checksumPath = writeTempFile(checksumAssetName, `not-a-checksum\n${artifactChecksum}  ${artifactName}\n`)

    expect((): void => getChecksumFromFile(checksumPath, artifactName)).toThrow(
      "Checksum file must use '<sha256>  <asset name>' format",
    )
  })

  it("fails when the asset name does not match", (): void => {
    const checksumPath = writeTempFile(checksumAssetName, `${artifactChecksum}  other-artifact.tar.gz\n`)

    expect((): void => getChecksumFromFile(checksumPath, artifactName)).toThrow(
      `Checksum asset name mismatch: expected ${artifactName}, got other-artifact.tar.gz`,
    )
  })

  it("fails when the checksum file is empty", (): void => {
    const checksumPath = writeTempFile(checksumAssetName, "\n")

    expect((): void => getChecksumFromFile(checksumPath, artifactName)).toThrow(
      "Checksum file does not contain a checksum",
    )
  })
})

describe("getChecksumFromKnownList", (): void => {
  it("returns undefined when the artifact is not in the known checksum list", (): void => {
    expect(getChecksumFromKnownList("missing-artifact-v0.0.0")).toBeUndefined()
  })
})

describe("verifyChecksum", (): void => {
  it("verifies a matching checksum value", (): void => {
    const downloadPath = createArtifactFile()

    expect((): void => verifyChecksum(downloadPath, artifactChecksum, artifactName)).not.toThrow()
  })

  it("does not normalize whitespace or casing in checksum values", (): void => {
    const downloadPath = createArtifactFile()
    const expectedChecksum = `  ${artifactChecksum.toUpperCase()}  `

    expect((): void => verifyChecksum(downloadPath, expectedChecksum, artifactName)).toThrow(
      `Checksum mismatch for ${artifactName}: expected ${expectedChecksum}, got ${artifactChecksum}`,
    )
  })

  it("fails when the checksum value is empty", (): void => {
    const downloadPath = createArtifactFile()

    expect((): void => verifyChecksum(downloadPath, "", artifactName)).toThrow("Expected checksum cannot be empty")
  })

  it("treats a whitespace-only checksum as a mismatch instead of empty", (): void => {
    const downloadPath = createArtifactFile()

    expect((): void => verifyChecksum(downloadPath, "  ", artifactName)).toThrow(
      `Checksum mismatch for ${artifactName}: expected   , got ${artifactChecksum}`,
    )
  })

  it("fails when the checksum does not match", (): void => {
    const downloadPath = createArtifactFile()
    const wrongChecksum = "0".repeat(64)

    expect((): void => verifyChecksum(downloadPath, wrongChecksum, artifactName)).toThrow(
      `Checksum mismatch for ${artifactName}: expected ${wrongChecksum}, got ${artifactChecksum}`,
    )
  })
})
