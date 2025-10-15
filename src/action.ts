import * as core from '@actions/core'
import { AxiosError } from 'axios'

import { DeploymentState, GitHubService } from './github.service.js'
import { Seconds, wait } from './helpers/wait.helper.js'
import {
  RenderDeployStatus,
  RenderErrorResponse,
  RenderService
} from './render.service.js'

export default class Action {
  async run(): Promise<void> {
    try {
      const serviceId = core.getInput('service_id', { required: true })
      core.debug(`service_id: ${serviceId}`);
      const apiKey = core.getInput('api_key', { required: true })
      core.setSecret(apiKey);
      core.debug(`api_key: ${apiKey}`);
      const clearCache = core.getBooleanInput('clear_cache')
      core.debug(`clear_cache: ${clearCache}`)
      const waitDeploy = core.getBooleanInput('wait_deploy')
      core.debug(`wait_deploy: ${waitDeploy}`)

      const createGithubDeployment = core.getBooleanInput('github_deployment')
      core.debug(`github_deployment: ${createGithubDeployment}`)
      const githubToken = core.getInput('github_token')
      core.setSecret(githubToken);
      core.debug(`github_token: ${githubToken}`)
      const environment = core.getInput('deployment_environment')
      core.debug(`deployment_environment: ${environment}`)

      const [owner, repo] = (process.env.GITHUB_REPOSITORY as string).split('/')
      const ref = process.env.GITHUB_REF as string

      const renderService = new RenderService({ apiKey, serviceId })
      const githubService = new GitHubService({ githubToken, owner, repo })
      core.debug(`Triggering Deploy on render.com for service ${serviceId}`)
      const deployId = await renderService.triggerDeploy({ clearCache })
      core.debug(`Deploy triggered. Deploy ID: ${deployId}`)
      let serviceUrl = ''
      let deploymentId = 0

      if (createGithubDeployment) {
        core.debug("Creating GitHub Deployment")
        deploymentId = await githubService.createDeployment(ref, environment)
        core.debug(`Created GitHub Deployment. Deployment ID: ${deploymentId}`)
        serviceUrl = await renderService.getServiceUrl()
        core.debug(`Render Service URL: ${serviceUrl}`)
        const ghDeployState = waitDeploy ? DeploymentState.IN_PROGRESS : DeploymentState.SUCCESS;
        const ghDeployUrl = waitDeploy ? undefined : serviceUrl;
        core.debug(`Set GH Deployment state: ${ghDeployState}, url: ${waitDeploy ? "awaiting successful deploy" : ghDeployUrl}`)
        await githubService.createDeploymentStatus(deploymentId, ghDeployState, ghDeployUrl)
      }

      if (waitDeploy) {
        let waitStatus = true
        let currentDeployStatus = RenderDeployStatus.CREATED

        core.info('Waiting for deploy successful status.')

        while (waitStatus) {
          const failureStatuses = [
            RenderDeployStatus.BUILD_FAILED,
            RenderDeployStatus.CANCELED,
            RenderDeployStatus.DEACTIVATED,
            RenderDeployStatus.UPLOAD_FAILED,
            RenderDeployStatus.PRE_DEPLOY_FAILED
          ]
          await wait(Seconds.TEN)
          const status = await renderService.verifyDeployStatus(deployId)

          if (status === RenderDeployStatus.LIVE) {
            if (createGithubDeployment) {
              core.debug(`Set GH Deployment state: ${DeploymentState.SUCCESS}, url: ${serviceUrl}`)
              await githubService.createDeploymentStatus(
                deploymentId,
                DeploymentState.SUCCESS,
                serviceUrl
              )
            }
            waitStatus = false
            return core.info(`The service has been deployed.`)
          }

          if (failureStatuses.includes(status)) {
            if (createGithubDeployment) {
              core.debug(`Set GH Deployment state: ${DeploymentState.FAILURE}`)
              await githubService.createDeploymentStatus(
                deploymentId,
                DeploymentState.FAILURE
              )
            }
            return core.setFailed(`The deploy exited with status: ${status}.`)
          }

          if (status !== currentDeployStatus) {
            core.info(`Deploy status: ${status}.`)
            currentDeployStatus = status
          }
        }
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status) {
        core.debug(`Error response:\n${JSON.stringify(error.toJSON())}`)
        const status = error.response.status

        return core.setFailed(
          RenderErrorResponse[status as keyof typeof RenderErrorResponse] ||
          'Unexpected error'
        )
      }
      if (error instanceof Error) return core.setFailed(error.message)
    }
  }
}
