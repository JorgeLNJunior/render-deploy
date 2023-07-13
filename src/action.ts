import * as core from '@actions/core'
import {AxiosError} from 'axios'

import {GitHubService} from './github.service'
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

      const githubToken = core.getInput('github_token', {required: true})
      const environment = core.getInput('deployment_environment')

      const [owner, repo] = (process.env.GITHUB_REPOSITORY as string).split('/')
      const ref = process.env.GITHUB_REF as string
      const actor = process.env.GITHUB_ACTOR as string

      const renderService = new RenderService({apiKey, serviceId})
      const githubService = new GitHubService({githubToken, owner, repo})

      const deployId = await renderService.triggerDeploy({clearCache})
      await githubService.createDeployment(ref, actor, environment)

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
            waitStatus = false
            return core.info(`The service has been deployed.`)
          }

          if (failureStatuses.includes(status)) {
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
