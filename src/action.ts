import * as core from '@actions/core'
import {AxiosError} from 'axios'

import {RenderErrorResponse, RenderService} from './render.service'

export default class Action {
  async run(): Promise<void> {
    try {
      const serviceId = core.getInput('service_id', {required: true})
      const apiKey = core.getInput('api_key', {required: true})
      const clearCache = core.getBooleanInput('clear_cache')

      await new RenderService({apiKey, serviceId}).triggerDeploy({clearCache})
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
