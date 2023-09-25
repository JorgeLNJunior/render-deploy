import {Octokit} from 'octokit'

export class GitHubService {
  private config: GitHubConfig
  private octo: Octokit

  constructor(config: GitHubConfig) {
    this.config = config
    this.octo = new Octokit({
      auth: this.config.githubToken
    })
  }

  /**
   * Creates a deployment.
   *
   * @param {string} ref - The reference to the commit to deploy.
   * @param {string} [environment] - The environment to deploy the commit to.
   * @return {Promise<number>} The ID of the created deployment.
   */
  async createDeployment(ref: string, environment?: string): Promise<number> {
    const response = await this.octo.rest.repos.createDeployment({
      owner: this.config.owner,
      repo: this.config.repo,
      production_environment: true,
      required_contexts: [],
      environment,
      ref
    })
    if (response.status === 201) return response.data.id
    throw new Error(`github api error: ${response.data.message}`)
  }

  /**
   * Creates a deployment status for a given deployment ID.
   *
   * @param {number} deploymentID - The ID of the deployment.
   * @param {DeploymentState} state - The state of the deployment.
   * @param {string} [deploymentURL] - The URL to access the deployed application (optional).
   * @return {Promise<void>} A promise that resolves when the deployment status is created.
   */
  async createDeploymentStatus(
    deploymentID: number,
    state: DeploymentState,
    deploymentURL?: string
  ): Promise<void> {
    await this.octo.rest.repos.createDeploymentStatus({
      owner: this.config.owner,
      repo: this.config.repo,
      deployment_id: deploymentID,
      environment_url: deploymentURL,
      state
    })
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
