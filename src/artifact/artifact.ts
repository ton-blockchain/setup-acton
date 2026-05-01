import type { Architecture } from "@/artifact/architecture"
import type { Platform } from "@/artifact/platform"
import type { Version } from "@/version/resolve"

const platformTargets: Readonly<Record<Platform, string>> = {
  apple: "apple-darwin",
  linux: "unknown-linux-gnu",
  windows: "pc-windows-msvc",
} as const

export class Artifact {
  public constructor(
    public readonly name: string,
    public readonly version: Version,
    public readonly architecture: Architecture,
    public readonly platform: Platform,
  ) {}

  public get artifactName(): string {
    const target = platformTargets[this.platform] ?? this.platform

    return `${this.name}-${this.architecture}-${target}`
  }

  public get archiveName(): string {
    return `${this.artifactName}.tar.gz`
  }

  public get checksumName(): string {
    return `${this.archiveName}.sha256`
  }

  public get knownName(): string {
    return `${this.artifactName}-${this.version}`
  }
}
