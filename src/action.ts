import * as core from '@actions/core'
import {AxiosError} from 'axios'

import {wait} from './helpers/wait.helper'
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

        core.info('Waiting deploy successful status')

        while (waitStatus) {
          await wait(10)
          const status = await renderService.verifyDeployStatus(deployId)

          if (
            status === RenderDeployStatus.BUILD_FAILED ||
            status === RenderDeployStatus.CANCELED ||
            status === RenderDeployStatus.DEACTIVATED ||
            status === RenderDeployStatus.UPLOAD_FAILED
          ) {
            return core.setFailed(`The deploy exited with status: ${status}`)
          }

          if (status === RenderDeployStatus.LIVE) waitStatus = false

          core.info(`Deploy status: ${status}`)
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
