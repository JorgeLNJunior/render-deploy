import * as core from '@actions/core'
import {AxiosError} from 'axios'

import {DeploymentState, GitHubService} from './github.service'
import {Seconds, wait} from './helpers/wait.helper'
import {
  RenderDeployStatus,
  RenderErrorResponse,
  RenderService
} from './render.service'

export default class Action {
  async run(): Promise<void> {
    try {
      const serviceId = core.getInput('service_id', {required: true})
      const apiKey = core.getInput('api_key', {required: true})
      const clearCache = core.getBooleanInput('clear_cache')
      const waitDeploy = core.getBooleanInput('wait_deploy')

      const createGithubDeployment = core.getBooleanInput('github_deployment')
      const githubToken = core.getInput('github_token')
      const environment = core.getInput('deployment_environment')

      const [owner, repo] = (process.env.GITHUB_REPOSITORY as string).split('/')
      const ref = process.env.GITHUB_REF as string

      const renderService = new RenderService({apiKey, serviceId})
      const githubService = new GitHubService({githubToken, owner, repo})

      const deployId = await renderService.triggerDeploy({clearCache})
      let serviceUrl = ''
      let deploymentId = 0

      if (createGithubDeployment) {
        deploymentId = await githubService.createDeployment(ref, environment)
        serviceUrl = await renderService.getServiceUrl()
        await githubService.createDeploymentStatus(
          deploymentId,
          serviceUrl,
          waitDeploy ? DeploymentState.IN_PROGRESS : DeploymentState.SUCCESS
        )
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
            RenderDeployStatus.UPLOAD_FAILED
          ]

          await wait(Seconds.TEN)
          const status = await renderService.verifyDeployStatus(deployId)

          if (status === RenderDeployStatus.LIVE) {
            if (createGithubDeployment) {
              await githubService.createDeploymentStatus(
                deploymentId,
                serviceUrl,
                DeploymentState.SUCCESS
              )
            }
            waitStatus = false
            return core.info(`The service has been deployed.`)
          }

          if (failureStatuses.includes(status)) {
            if (createGithubDeployment) {
              await githubService.createDeploymentStatus(
                deploymentId,
                serviceUrl,
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
