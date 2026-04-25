import * as github from "@actions/github"

type Octokit = ReturnType<typeof github.getOctokit>

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
