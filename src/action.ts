import * as core from '@actions/core'
import {AxiosError} from 'axios'
import {RenderService} from './render.service'

export default class Action {
  async run(): Promise<void> {
    try {
      const serviceId = core.getInput('service_id', {required: true})
      const apiKey = core.getInput('api_key', {required: true})

      await new RenderService({apiKey, serviceId}).triggerDeploy()
    } catch (error) {
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case 401:
            return core.setFailed('invalid api key')
          case 404:
            return core.setFailed('invalid service id')
          case 429:
            return core.setFailed('too many requests')
          case 500:
            return core.setFailed('render api error')
          case 503:
            return core.setFailed('render api unavailable')
        }
      }
      if (error instanceof Error) return core.setFailed(error.message)
    }
  }
}
