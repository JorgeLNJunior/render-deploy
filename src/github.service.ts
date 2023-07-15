import {request} from '@octokit/request'
import fetch from 'node-fetch'

export class GitHubService {
  private config: GitHubConfig

  constructor(config: GitHubConfig) {
    this.config = config
  }

  async createDeployment(ref: string, environment?: string): Promise<number> {
    const response = await request('POST /repos/{owner}/{repo}/deployments', {
      owner: this.config.owner,
      repo: this.config.repo,
      headers: {
        authorization: `Bearer ${this.config.githubToken}`
      },
      production_environment: true,
      environment,
      ref,
      options: {
        request: {
          fetch
        }
      }
    })
    if (response.status === 201) return response.data.id
    throw new Error(`github api error: ${response.data.message}`)
  }

  async createDeploymentStatus(
    deploymentID: number,
    deploymentURL: string,
    state: DeploymentState
  ): Promise<void> {
    await request(
      'POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses',
      {
        owner: this.config.owner,
        repo: this.config.repo,
        deployment_id: deploymentID,
        log_url: deploymentURL,
        state,
        options: {
          request: {
            fetch
          }
        }
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
