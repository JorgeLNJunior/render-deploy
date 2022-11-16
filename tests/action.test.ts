import * as core from '@actions/core'
import {describe, expect, jest, test} from '@jest/globals'

import Action from '../src/action'
import {RenderErrorResponse, RenderService} from '../src/render.service'
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

  test('should call render api with clear_cache option', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'true'

    const renderSpy = jest.spyOn(RenderService.prototype, 'triggerDeploy')

    await new Action().run()

    expect(renderSpy).toHaveBeenCalledTimes(1)
    expect(renderSpy).toHaveBeenCalledWith({
      clearCache: true
    })
  })
})

describe('deploy', () => {
  test('should trigger a deploy', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'

    const spy = jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValue()

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('error handling', () => {
  test('should exit if the server retuns 401', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementation(() => {
        throw getAxiosError(401)
      })

    new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[401])
  })

  test('should exit if the server retuns 404', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementation(() => {
        throw getAxiosError(404)
      })

    new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[404])
  })

  test('should exit if the server retuns 429', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementation(() => {
        throw getAxiosError(429)
      })

    new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[429])
  })

  test('should exit if the server retuns 500', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementation(() => {
        throw getAxiosError(500)
      })

    new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[500])
  })

  test('should exit if the server retuns 503', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementation(() => {
        throw getAxiosError(503)
      })

    new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[503])
  })

  test('should exit if the server retuns an unexpected message', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementation(() => {
        throw getAxiosError(507)
      })

    new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith('Unexpected error')
  })
})
