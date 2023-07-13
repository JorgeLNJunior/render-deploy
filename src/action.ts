import * as core from '@actions/core'
import {AxiosError} from 'axios'

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
      const renderService = new RenderService({apiKey, serviceId})

      const deployId = await renderService.triggerDeploy({clearCache})

      if (waitDeploy) {
        let waitStatus = true
        let currentDeployStatus = RenderDeployStatus.CREATED

        core.info('Waiting for deploy successful status.')

        while (waitStatus) {
          const failedStatuses = [
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

          if (failedStatuses.includes(status)) {
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
