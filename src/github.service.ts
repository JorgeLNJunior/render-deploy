import fetch from 'node-fetch'
import {Octokit} from 'octokit'

export class GitHubService {
  private config: GitHubConfig
  private octo: Octokit

  constructor(config: GitHubConfig) {
    this.config = config
    this.octo = new Octokit({
      auth: this.config.githubToken,
      request: {fetch}
    })
  }

  async createDeployment(ref: string, environment?: string): Promise<number> {
    const response = await this.octo.request(
      'POST /repos/{owner}/{repo}/deployments',
      {
        owner: this.config.owner,
        repo: this.config.repo,
        headers: {
          authorization: `Bearer ${this.config.githubToken}`
        },
        production_environment: true,
        environment,
        ref
      }
    )
    if (response.status === 201) return response.data.id
    throw new Error(`github api error: ${response.data.message}`)
  }

  async createDeploymentStatus(
    deploymentID: number,
    deploymentURL: string,
    state: DeploymentState
  ): Promise<void> {
    await this.octo.request(
      'POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
      {
        owner: this.config.owner,
        repo: this.config.repo,
        deployment_id: deploymentID,
        log_url: deploymentURL,
        environment_url: deploymentURL,
        state
      }
    )
  }
}

export enum DeploymentState {
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILURE = 'failure'
}

interface GitHubConfig {
  githubToken: string
  owner: string
  repo: string
}
