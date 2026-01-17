import { Octokit } from 'octokit'

export class GitHubService {
  private config: GitHubConfig
  private octo: Octokit

  constructor(config: GitHubConfig) {
    this.config = config
    this.octo = new Octokit({
      auth: this.config.githubToken,
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
      ref,
    })
    if (response.status === 201) return response.data.id
    throw new Error(`GitHub API error: ${response.data.message}`)
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
    deploymentURL?: string,
  ): Promise<void> {
    await this.octo.rest.repos.createDeploymentStatus({
      owner: this.config.owner,
      repo: this.config.repo,
      deployment_id: deploymentID,
      environment_url: deploymentURL,
      state,
    })
  }

  /**
   * Retrieves the latest commit SHA for a specific branch.
   *
   * @param {string} branch - The name of the branch.
   * @return {Promise<string>} The SHA of the latest commit.
   */
  async getBranchLatestCommit(branch: string): Promise<string> {
    const response = await this.octo.rest.repos.getBranch({
      owner: this.config.owner,
      repo: this.config.repo,
      branch,
    })

    if (response.status !== 200 && response.status !== 301) {
      throw new Error(
        `Could not get branch "${branch}" for "${this.config.repo}/${this.config.owner}". Failed with "${response.status}"`,
      )
    }

    return response.data.commit.sha
  }
}

export enum DeploymentState {
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILURE = 'failure',
}

interface GitHubConfig {
  githubToken: string
  owner: string
  repo: string
}
