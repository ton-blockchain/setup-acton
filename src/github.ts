import * as github from "@actions/github"
import type { GitHub as GH } from "@actions/github/lib/utils"

type Octokit = InstanceType<typeof GH>

export class GitHub {
  private readonly githubToken: string
  private readonly octokit: Octokit

  public constructor(githubToken: string) {
    this.githubToken = githubToken
    this.octokit = github.getOctokit(githubToken)
  }

  public getOctokit(): Octokit {
    return this.octokit
  }

  public getAuthToken(): string {
    return `token ${this.githubToken}`
  }
}
