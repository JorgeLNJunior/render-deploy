import * as core from '@actions/core'
import {describe, expect, jest, test} from '@jest/globals'

import Action from '../src/action'
import {
  RenderDeployStatus,
  RenderErrorResponse,
  RenderService
} from '../src/render.service'
import {getAxiosError} from './helpers/axios.helper'

describe('inputs', () => {
  afterEach(() => jest.clearAllMocks())

  test('should throw an error if the input "service_id" is missing', async () => {
    const coreSpy = jest.spyOn(core, 'setFailed')

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(
      'Input required and not supplied: service_id'
    )
  })

  test('should throw an error if the input "api_key" is missing', async () => {
    process.env['INPUT_SERVICE_ID'] = 'serviceId'

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
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
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
  afterEach(() => jest.clearAllMocks())

  test('should trigger a deploy', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'

    const spy = jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValue('123')

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('should wait until the deploy is completed', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'true'

    const spy = jest
      .spyOn(RenderService.prototype, 'verifyDeployStatus')
      .mockResolvedValue(RenderDeployStatus.LIVE)

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  describe('deploy error handling', () => {
    afterEach(() => jest.clearAllMocks())

    test('should exit if the deploy status is "build_failed"', async () => {
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'

      const spy = jest
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValue(RenderDeployStatus.BUILD_FAILED)
      const coreSpy = jest.spyOn(core, 'setFailed')

      await new Action().run()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(coreSpy).toHaveBeenCalledWith(
        `The deploy exited with status: ${RenderDeployStatus.BUILD_FAILED}`
      )
    })

    test('should exit if the deploy status is "canceled"', async () => {
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'

      const spy = jest
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValue(RenderDeployStatus.CANCELED)
      const coreSpy = jest.spyOn(core, 'setFailed')

      await new Action().run()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(coreSpy).toHaveBeenCalledWith(
        `The deploy exited with status: ${RenderDeployStatus.CANCELED}`
      )
    })

    test('should exit if the deploy status is "deactivated"', async () => {
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'

      const spy = jest
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValue(RenderDeployStatus.DEACTIVATED)
      const coreSpy = jest.spyOn(core, 'setFailed')

      await new Action().run()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(coreSpy).toHaveBeenCalledWith(
        `The deploy exited with status: ${RenderDeployStatus.DEACTIVATED}`
      )
    })

    test('should exit if the deploy status is "update_failed"', async () => {
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'

      const spy = jest
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValue(RenderDeployStatus.UPLOAD_FAILED)
      const coreSpy = jest.spyOn(core, 'setFailed')

      await new Action().run()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(coreSpy).toHaveBeenCalledWith(
        `The deploy exited with status: ${RenderDeployStatus.UPLOAD_FAILED}`
      )
    })
  })
})

describe('error handling', () => {
  afterEach(() => jest.clearAllMocks())

  test('should exit if the server retuns 401', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementationOnce(() => {
        throw getAxiosError(401)
      })

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[401])
  })

  test('should exit if the server retuns 404', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementationOnce(() => {
        throw getAxiosError(404)
      })

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[404])
  })

  test('should exit if the server retuns 429', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementationOnce(() => {
        throw getAxiosError(429)
      })

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[429])
  })

  test('should exit if the server retuns 500', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementationOnce(() => {
        throw getAxiosError(500)
      })

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[500])
  })

  test('should exit if the server retuns 503', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementationOnce(() => {
        throw getAxiosError(503)
      })

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[503])
  })

  test('should exit if the server retuns an unexpected message', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockImplementationOnce(() => {
        throw getAxiosError(507)
      })

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith('Unexpected error')
  })
})
