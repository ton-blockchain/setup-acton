import { createHash } from "node:crypto"
import * as fs from "node:fs"

export type ParsedChecksum = {
  readonly checksum: string
  readonly assetName: string
}

export function parseChecksum(checksumContents: string): ParsedChecksum {
  const firstLine = checksumContents.split("\n", 1)[0].trim()
  if (firstLine === "") {
    throw new Error("Checksum file does not contain a checksum")
  }

  const parts = firstLine.split("  ")
  if (parts.length !== 2) {
    throw new Error("Checksum file must use '<sha256>  <asset name>' format")
  }

  const checksum = parts[0].toLowerCase()
  const assetName = parts[1]
  if (checksum === "" || assetName === "") {
    throw new Error("Checksum file must use '<sha256>  <asset name>' format")
  }

  return { checksum, assetName }
}

function calculateSha256(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").toLowerCase()
}

export function verifyChecksum(toolchainPath: string, checksumPath: string, artifactName: string): void {
  const { checksum: expectedChecksum, assetName } = parseChecksum(fs.readFileSync(checksumPath, "utf8"))
  if (assetName !== artifactName) {
    throw new Error(`Checksum asset name mismatch: expected ${artifactName}, got ${assetName}`)
  }

  const actualChecksum = calculateSha256(toolchainPath)
  if (actualChecksum !== expectedChecksum) {
    throw new Error(`Checksum mismatch for ${artifactName}: expected ${expectedChecksum}, got ${actualChecksum}`)
  }
}
