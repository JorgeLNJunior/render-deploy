import * as core from '@actions/core'
import {describe, expect, jest, test} from '@jest/globals'

import Action from '../src/action'
import {GitHubService} from '../src/github.service'
import {
  RenderDeployStatus,
  RenderErrorResponse,
  RenderService
} from '../src/render.service'
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
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
    process.env['GITHUB_REPOSITORY'] = 'action/test'

    const spy = jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValueOnce('')

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith({
      clearCache: true
    })
  })
})

describe('deploy', () => {
  test('should trigger a deploy', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
    process.env['GITHUB_REPOSITORY'] = 'action/test'

    const spy = jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValueOnce('id')

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('should wait until the deploy is completed', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'true'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
    process.env['GITHUB_REPOSITORY'] = 'action/test'

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValueOnce('id')
    const spy = jest
      .spyOn(RenderService.prototype, 'verifyDeployStatus')
      .mockResolvedValue(RenderDeployStatus.LIVE)

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  describe('deploy error handling', () => {
    test('should exit if the deploy status is "build_failed"', async () => {
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
      process.env['GITHUB_REPOSITORY'] = 'action/test'

      jest
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      const spy = jest
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValue(RenderDeployStatus.BUILD_FAILED)
      const coreSpy = jest.spyOn(core, 'setFailed')

      await new Action().run()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(coreSpy).toHaveBeenCalledWith(
        `The deploy exited with status: ${RenderDeployStatus.BUILD_FAILED}.`
      )
    })

    test('should exit if the deploy status is "canceled"', async () => {
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
      process.env['GITHUB_REPOSITORY'] = 'action/test'

      jest
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      const spy = jest
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValue(RenderDeployStatus.CANCELED)
      const coreSpy = jest.spyOn(core, 'setFailed')

      await new Action().run()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(coreSpy).toHaveBeenCalledWith(
        `The deploy exited with status: ${RenderDeployStatus.CANCELED}.`
      )
    })

    test('should exit if the deploy status is "deactivated"', async () => {
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
      process.env['GITHUB_REPOSITORY'] = 'action/test'

      jest
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      const spy = jest
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValue(RenderDeployStatus.DEACTIVATED)
      const coreSpy = jest.spyOn(core, 'setFailed')

      await new Action().run()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(coreSpy).toHaveBeenCalledWith(
        `The deploy exited with status: ${RenderDeployStatus.DEACTIVATED}.`
      )
    })

    test('should exit if the deploy status is "update_failed"', async () => {
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
      process.env['GITHUB_REPOSITORY'] = 'action/test'

      jest
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      const spy = jest
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValue(RenderDeployStatus.UPLOAD_FAILED)
      const coreSpy = jest.spyOn(core, 'setFailed')

      await new Action().run()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(coreSpy).toHaveBeenCalledWith(
        `The deploy exited with status: ${RenderDeployStatus.UPLOAD_FAILED}.`
      )
    })
  })
})

describe('Render error handling', () => {
  test('should exit if the server retuns 401', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
    process.env['GITHUB_REPOSITORY'] = 'action/test'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(401))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[401])
  })

  test('should exit if the server retuns 404', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
    process.env['GITHUB_REPOSITORY'] = 'action/test'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(404))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[404])
  })

  test('should exit if the server retuns 429', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
    process.env['GITHUB_REPOSITORY'] = 'action/test'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(429))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[429])
  })

  test('should exit if the server retuns 500', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
    process.env['GITHUB_REPOSITORY'] = 'action/test'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(500))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[500])
  })

  test('should exit if the server retuns 503', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
    process.env['GITHUB_REPOSITORY'] = 'action/test'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(503))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[503])
  })

  test('should exit if the server retuns an unexpected message', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'
    process.env['GITHUB_REPOSITORY'] = 'action/test'

    const coreSpy = jest.spyOn(core, 'setFailed')

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(507))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith('Unexpected error')
  })
})

describe('GitHub deployment', () => {
  test('should be optional', async () => {
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

    jest
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValueOnce('id')
    const spy = jest.spyOn(GitHubService.prototype, 'createDeployment')

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(0)
  })
})
