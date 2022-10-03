import Action from '../src/action'
import {describe, expect, jest, test} from '@jest/globals'
import * as core from '@actions/core'
import {RenderService} from '../src/render.service'
import {getAxiosError} from './helpers/axios.helper'

describe('inputs', () => {
  test('should throw an error if the input "service_id" is missing', async () => {
    const coreSpy = jest.spyOn(core, 'setFailed')

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(
      'Input required and not supplied: service_id'
    )
  })

  test('should throw an error if the input "api_key" is missing', async () => {
    process.env.INPUT_SERVICE_ID = 'serviceId'

    const coreSpy = jest.spyOn(core, 'setFailed')

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(
      'Input required and not supplied: api_key'
    )
  })
})

describe('deploy', () => {
  test('should trigger a deploy', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'

    const spy = jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValue()

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('error handling', () => {
  test('should exit with "invalid api key" if the server retuns 401', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementation(() => {
        throw getAxiosError(401)
      })

    new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith('invalid api key')
  })

  test('should exit with "invalid service id" if the server retuns 404', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementation(() => {
        throw getAxiosError(404)
      })

    new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith('invalid service id')
  })

  test('should exit with "too many requests" if the server retuns 429', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementation(() => {
        throw getAxiosError(429)
      })

    new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith('too many requests')
  })

  test('should exit with "render api error" if the server retuns 500', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementation(() => {
        throw getAxiosError(500)
      })

    new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith('render api error')
  })

  test('should exit with "render api unavailable" if the server retuns 503', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementation(() => {
        throw getAxiosError(503)
      })

    new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith('render api unavailable')
  })
})
