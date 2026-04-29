import type { Architecture } from "@/artifact/architecture"
import type { Platform } from "@/artifact/platform"

export class Artifact {
  public constructor(
    public readonly name: string,
    public readonly version: string,
    public readonly platform: Platform,
    public readonly architecture: Architecture,
  ) {}

  public get artifactName(): string {
    let target: string
    switch (this.platform) {
      case "linux":
        target = "unknown-linux-gnu"
        break
      case "apple":
        target = "apple-darwin"
        break
      case "windows":
        target = "pc-windows-msvc"
        break
      default:
        target = this.platform
        break
    }

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
