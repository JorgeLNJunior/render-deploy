import {request} from '@octokit/request'

export class GitHubService {
  private config: GitHubConfig

  constructor(config: GitHubConfig) {
    this.config = config
  }

  async createDeployment(
    ref: string,
    actor: string,
    environment?: string
  ): Promise<number> {
    const response = await request('POST /repos/{owner}/{repo}/deployments', {
      owner: this.config.owner,
      repo: this.config.repo,
      headers: {
        authorization: `Bearer ${this.config.githubToken}`
      },
      description: `Deploy requested by ${actor}`,
      production_environment: true,
      environment,
      ref
    })
    if (response.status === 201) return response.data.id
    throw new Error(`github api error: ${response.data.message}`)
  }
}

interface GitHubConfig {
  githubToken: string
  owner: string
  repo: string
}
