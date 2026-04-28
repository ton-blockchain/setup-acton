import { describe, expect, it } from "vitest"
import type { Architecture } from "@/artifact/architecture"
import { Artifact } from "@/artifact/artifact"
import type { Platform } from "@/artifact/platform"

type ArtifactCase = Readonly<{
  name: string
  version: string
  platform: Platform
  architecture: Architecture
  archiveName: string
  knownName: string
  checksumName: string
}>

const artifactCases: readonly ArtifactCase[] = [
  {
    name: "acton",
    version: "v1.2.3",
    platform: "linux",
    architecture: "x86_64",
    archiveName: "acton-x86_64-unknown-linux-gnu.tar.gz",
    knownName: "acton-x86_64-unknown-linux-gnu-v1.2.3",
    checksumName: "acton-x86_64-unknown-linux-gnu.tar.gz.sha256",
  },
  {
    name: "acton",
    version: "v1.2.3",
    platform: "linux",
    architecture: "aarch64",
    archiveName: "acton-aarch64-unknown-linux-gnu.tar.gz",
    knownName: "acton-aarch64-unknown-linux-gnu-v1.2.3",
    checksumName: "acton-aarch64-unknown-linux-gnu.tar.gz.sha256",
  },
  {
    name: "acton",
    version: "v1.2.3",
    platform: "apple",
    architecture: "x86_64",
    archiveName: "acton-x86_64-apple-darwin.tar.gz",
    knownName: "acton-x86_64-apple-darwin-v1.2.3",
    checksumName: "acton-x86_64-apple-darwin.tar.gz.sha256",
  },
  {
    name: "acton",
    version: "v1.2.3",
    platform: "apple",
    architecture: "aarch64",
    archiveName: "acton-aarch64-apple-darwin.tar.gz",
    knownName: "acton-aarch64-apple-darwin-v1.2.3",
    checksumName: "acton-aarch64-apple-darwin.tar.gz.sha256",
  },
  {
    name: "acton",
    version: "v1.2.3",
    platform: "windows",
    architecture: "x86_64",
    archiveName: "acton-x86_64-pc-windows-msvc.tar.gz",
    knownName: "acton-x86_64-pc-windows-msvc-v1.2.3",
    checksumName: "acton-x86_64-pc-windows-msvc.tar.gz.sha256",
  },
  {
    name: "acton",
    version: "v1.2.3",
    platform: "windows",
    architecture: "aarch64",
    archiveName: "acton-aarch64-pc-windows-msvc.tar.gz",
    knownName: "acton-aarch64-pc-windows-msvc-v1.2.3",
    checksumName: "acton-aarch64-pc-windows-msvc.tar.gz.sha256",
  },
]

describe("Artifact", (): void => {
  it.each(artifactCases)("exposes all fields and artifact name for $platform/$architecture", ({
    name,
    version,
    platform,
    architecture,
    archiveName,
    knownName,
    checksumName,
  }): void => {
    const artifact = new Artifact(name, version, platform, architecture)

    expect(artifact.name).toBe(name)
    expect(artifact.version).toBe(version)
    expect(artifact.platform).toBe(platform)
    expect(artifact.architecture).toBe(architecture)
    expect(artifact.archiveName).toBe(archiveName)
    expect(artifact.knownName).toBe(knownName)
    expect(artifact.checksumName).toBe(checksumName)
  })

  it("uses the raw platform value for unsupported platform variants", (): void => {
    const artifact = new Artifact("acton", "v1.2.3", "freebsd" as Platform, "x86_64")

    expect(artifact.archiveName).toBe("acton-x86_64-freebsd.tar.gz")
    expect(artifact.knownName).toBe("acton-x86_64-freebsd-v1.2.3")
    expect(artifact.checksumName).toBe("acton-x86_64-freebsd.tar.gz.sha256")
  })
})
