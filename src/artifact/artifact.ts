import type { Architecture } from "@/artifact/architecture"
import type { Platform } from "@/artifact/platform"

const platformTargets: Readonly<Record<Platform, string>> = {
  apple: "apple-darwin",
  linux: "unknown-linux-gnu",
  windows: "pc-windows-msvc",
}

export class Artifact {
  public constructor(
    public readonly name: string,
    public readonly version: string,
    public readonly platform: Platform,
    public readonly architecture: Architecture,
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
