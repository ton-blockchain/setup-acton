import type { Platform } from "./platform"
import type { Architecture } from "./architecture"

export class Artifact {
  public constructor(
    readonly name: string,
    readonly artifactVersion: string,
    readonly platform: Platform,
    readonly architecture: Architecture,
  ) {}

  get artifactName(): string {
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

    return `${this.name}-${this.architecture}-${target}.tar.gz`
  }
}
