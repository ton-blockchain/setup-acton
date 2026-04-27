import { describe, expect, it } from "@jest/globals"
import type { Architecture } from "@/artifact/architecture"
import { Artifact } from "@/artifact/artifact"
import type { Platform } from "@/artifact/platform"

type ArtifactCase = Readonly<{
  name: string
  artifactVersion: string
  platform: Platform
  architecture: Architecture
  artifactName: string
}>

const artifactCases: ReadonlyArray<ArtifactCase> = [
  {
    name: "acton",
    artifactVersion: "v1.2.3",
    platform: "linux",
    architecture: "x86_64",
    artifactName: "acton-x86_64-unknown-linux-gnu.tar.gz",
  },
  {
    name: "acton",
    artifactVersion: "v1.2.3",
    platform: "linux",
    architecture: "aarch64",
    artifactName: "acton-aarch64-unknown-linux-gnu.tar.gz",
  },
  {
    name: "acton",
    artifactVersion: "v1.2.3",
    platform: "apple",
    architecture: "x86_64",
    artifactName: "acton-x86_64-apple-darwin.tar.gz",
  },
  {
    name: "acton",
    artifactVersion: "v1.2.3",
    platform: "apple",
    architecture: "aarch64",
    artifactName: "acton-aarch64-apple-darwin.tar.gz",
  },
  {
    name: "acton",
    artifactVersion: "v1.2.3",
    platform: "windows",
    architecture: "x86_64",
    artifactName: "acton-x86_64-pc-windows-msvc.tar.gz",
  },
  {
    name: "acton",
    artifactVersion: "v1.2.3",
    platform: "windows",
    architecture: "aarch64",
    artifactName: "acton-aarch64-pc-windows-msvc.tar.gz",
  },
]

describe("Artifact", (): void => {
  it.each(artifactCases)(
    "exposes all fields and artifact name for $platform/$architecture",
    ({ name, artifactVersion, platform, architecture, artifactName }): void => {
      const artifact = new Artifact(name, artifactVersion, platform, architecture)

      expect(artifact.name).toBe(name)
      expect(artifact.artifactVersion).toBe(artifactVersion)
      expect(artifact.platform).toBe(platform)
      expect(artifact.architecture).toBe(architecture)
      expect(artifact.artifactName).toBe(artifactName)
      expect(artifact.artifactName).not.toContain(artifactVersion)
    },
  )
})
