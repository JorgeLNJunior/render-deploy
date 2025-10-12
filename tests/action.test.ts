import * as core from '@actions/core'
import { describe, expect, test, vi } from 'vitest'

import Action from '../src/action.js'
import { DeploymentState, GitHubService } from '../src/github.service.js'
import {
  RenderDeployStatus,
  RenderErrorResponse,
  RenderService
} from '../src/render.service.js'
import { getAxiosError } from './helpers/axios.helper.js'

describe('Inputs', () => {
  test('should throw an error if the input "service_id" is missing', async () => {
    const coreSpy = vi.spyOn(core, 'setFailed')

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(
      'Input required and not supplied: service_id'
    )
  })

  test('should throw an error if the input "api_key" is missing', async () => {
    process.env['INPUT_SERVICE_ID'] = 'serviceId'

    const coreSpy = vi.spyOn(core, 'setFailed')

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

    const spy = vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValueOnce('')

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith({
      clearCache: true
    })
  })
})

describe('Deploy', () => {
  test('should trigger a deploy', async () => {
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['GITHUB_REF'] = 'main'
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

    const spy = vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValueOnce('id')

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('should wait until the deploy is completed', async () => {
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['GITHUB_REF'] = 'main'
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'true'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

    vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValueOnce('id')
    const spy = vi
      .spyOn(RenderService.prototype, 'verifyDeployStatus')
      .mockResolvedValueOnce(RenderDeployStatus.LIVE)

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('should update the deploy status', async () => {
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['GITHUB_REF'] = 'main'
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'true'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

    const status = RenderDeployStatus.BUILD_IN_PROGRESS

    vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValueOnce('id')
    vi
      .spyOn(RenderService.prototype, 'verifyDeployStatus')
      .mockResolvedValueOnce(status) // first call
    vi
      .spyOn(RenderService.prototype, 'verifyDeployStatus')
      .mockResolvedValueOnce(RenderDeployStatus.LIVE) // second call
    const spy = vi.spyOn(core, 'info')

    await new Action().run()

    expect(spy).toHaveBeenCalledWith(`Deploy status: ${status}.`)
  })

  describe('Deploy error handling', () => {
    test('should exit if the deploy status is "build_failed"', async () => {
      process.env['GITHUB_REPOSITORY'] = 'action/test'
      process.env['GITHUB_REF'] = 'main'
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

      vi
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      const spy = vi
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValueOnce(RenderDeployStatus.BUILD_FAILED)
      const coreSpy = vi.spyOn(core, 'setFailed')

      await new Action().run()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(coreSpy).toHaveBeenCalledWith(
        `The deploy exited with status: ${RenderDeployStatus.BUILD_FAILED}.`
      )
    })

    test('should exit if the deploy status is "canceled"', async () => {
      process.env['GITHUB_REPOSITORY'] = 'action/test'
      process.env['GITHUB_REF'] = 'main'
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

      vi
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      const spy = vi
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValueOnce(RenderDeployStatus.CANCELED)
      const coreSpy = vi.spyOn(core, 'setFailed')

      await new Action().run()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(coreSpy).toHaveBeenCalledWith(
        `The deploy exited with status: ${RenderDeployStatus.CANCELED}.`
      )
    })

    test('should exit if the deploy status is "deactivated"', async () => {
      process.env['GITHUB_REPOSITORY'] = 'action/test'
      process.env['GITHUB_REF'] = 'main'
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

      vi
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      const spy = vi
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValueOnce(RenderDeployStatus.DEACTIVATED)
      const coreSpy = vi.spyOn(core, 'setFailed')

      await new Action().run()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(coreSpy).toHaveBeenCalledWith(
        `The deploy exited with status: ${RenderDeployStatus.DEACTIVATED}.`
      )
    })

    test('should exit if the deploy status is "update_failed"', async () => {
      process.env['GITHUB_REPOSITORY'] = 'action/test'
      process.env['GITHUB_REF'] = 'main'
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

      vi
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      const spy = vi
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValueOnce(RenderDeployStatus.UPLOAD_FAILED)
      const coreSpy = vi.spyOn(core, 'setFailed')

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
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['GITHUB_REF'] = 'main'
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

    const coreSpy = vi.spyOn(core, 'setFailed')

    vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(401))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[401])
  })

  test('should exit if the server retuns 404', async () => {
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['GITHUB_REF'] = 'main'
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

    const coreSpy = vi.spyOn(core, 'setFailed')

    vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(404))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[404])
  })

  test('should exit if the server retuns 429', async () => {
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['GITHUB_REF'] = 'main'
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

    const coreSpy = vi.spyOn(core, 'setFailed')

    vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(429))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[429])
  })

  test('should exit if the server retuns 500', async () => {
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['GITHUB_REF'] = 'main'
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

    const coreSpy = vi.spyOn(core, 'setFailed')

    vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(500))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[500])
  })

  test('should exit if the server retuns 503', async () => {
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['GITHUB_REF'] = 'main'
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

    const coreSpy = vi.spyOn(core, 'setFailed')

    vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(503))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith(RenderErrorResponse[503])
  })

  test('should exit if the server retuns an unexpected message', async () => {
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['GITHUB_REF'] = 'main'
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

    const coreSpy = vi.spyOn(core, 'setFailed')

    vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockRejectedValueOnce(getAxiosError(507))

    await new Action().run()

    expect(coreSpy).toHaveBeenCalledTimes(1)
    expect(coreSpy).toHaveBeenCalledWith('Unexpected error')
  })
})

describe('GitHub deployment', () => {
  test('should be optional', async () => {
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['GITHUB_REF'] = 'main'
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'false'

    vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValueOnce('id')
    const spy = vi
      .spyOn(GitHubService.prototype, 'createDeployment')
      .mockResolvedValueOnce(1)

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(0)
  })

  test('should create a deployment', async () => {
    process.env['GITHUB_REPOSITORY'] = 'action/test'
    process.env['GITHUB_REF'] = 'main'
    process.env['INPUT_SERVICE_ID'] = 'my service id'
    process.env['INPUT_API_KEY'] = 'my api key'
    process.env['INPUT_CLEAR_CACHE'] = 'false'
    process.env['INPUT_WAIT_DEPLOY'] = 'false'
    process.env['INPUT_GITHUB_DEPLOYMENT'] = 'true'

    vi
      .spyOn(RenderService.prototype, 'triggerDeploy')
      .mockResolvedValueOnce('id')
    vi
      .spyOn(RenderService.prototype, 'getServiceUrl')
      .mockResolvedValueOnce('url')
    vi
      .spyOn(GitHubService.prototype, 'createDeploymentStatus')
      .mockResolvedValueOnce()
    const spy = vi
      .spyOn(GitHubService.prototype, 'createDeployment')
      .mockResolvedValueOnce(1)

    await new Action().run()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  describe('Deployment status', () => {
    test('should create a deployment with success state if it does not have to wait', async () => {
      process.env['GITHUB_REPOSITORY'] = 'action/test'
      process.env['GITHUB_REF'] = 'main'
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'false'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'true'

      const deploymentID = 1
      const state = DeploymentState.SUCCESS
      const serviceURL = 'https://my-service.onrender.com'

      vi
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      vi
        .spyOn(RenderService.prototype, 'getServiceUrl')
        .mockResolvedValueOnce(serviceURL)
      vi
        .spyOn(GitHubService.prototype, 'createDeployment')
        .mockResolvedValueOnce(deploymentID)
      const spy = vi
        .spyOn(GitHubService.prototype, 'createDeploymentStatus')
        .mockResolvedValueOnce()

      await new Action().run()

      expect(spy).toHaveBeenCalledWith(deploymentID, state, serviceURL)
    })

    test('should create a deployment with in progress state if it does have to wait', async () => {
      process.env['GITHUB_REPOSITORY'] = 'action/test'
      process.env['GITHUB_REF'] = 'main'
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'true'

      const deploymentID = 1
      const state = DeploymentState.IN_PROGRESS
      const serviceURL = 'https://my-service.onrender.com'

      vi
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      vi
        .spyOn(RenderService.prototype, 'getServiceUrl')
        .mockResolvedValueOnce(serviceURL)
      vi
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValueOnce(RenderDeployStatus.LIVE)
      vi
        .spyOn(GitHubService.prototype, 'createDeployment')
        .mockResolvedValueOnce(deploymentID)
      const spy = vi
        .spyOn(GitHubService.prototype, 'createDeploymentStatus')
        .mockResolvedValue()

      await new Action().run()

      expect(spy).toHaveBeenNthCalledWith(1, deploymentID, state, undefined)
    })

    test('should create a deployment with success state if the deploy status is live', async () => {
      process.env['GITHUB_REPOSITORY'] = 'action/test'
      process.env['GITHUB_REF'] = 'main'
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'true'

      const deploymentID = 1
      const state = DeploymentState.SUCCESS
      const serviceURL = 'https://my-service.onrender.com'

      vi
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      vi
        .spyOn(RenderService.prototype, 'getServiceUrl')
        .mockResolvedValueOnce(serviceURL)
      vi
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValueOnce(RenderDeployStatus.LIVE)
      vi
        .spyOn(GitHubService.prototype, 'createDeployment')
        .mockResolvedValueOnce(deploymentID)
      vi
        .spyOn(GitHubService.prototype, 'createDeploymentStatus') // in progress call
        .mockResolvedValueOnce()
      const spy = vi
        .spyOn(GitHubService.prototype, 'createDeploymentStatus') // live deploy call
        .mockResolvedValueOnce()

      await new Action().run()

      expect(spy).toHaveBeenCalledWith(deploymentID, state, serviceURL)
    })

    test('should create a deployment with failure state if the deploy status is failure', async () => {
      process.env['GITHUB_REPOSITORY'] = 'action/test'
      process.env['GITHUB_REF'] = 'main'
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'true'

      const deploymentID = 1
      const state = DeploymentState.FAILURE
      const serviceURL = 'https://my-service.onrender.com'

      vi
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      vi
        .spyOn(RenderService.prototype, 'getServiceUrl')
        .mockResolvedValueOnce(serviceURL)
      vi
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValueOnce(RenderDeployStatus.BUILD_FAILED)
      vi
        .spyOn(GitHubService.prototype, 'createDeployment')
        .mockResolvedValueOnce(deploymentID)
      vi
        .spyOn(GitHubService.prototype, 'createDeploymentStatus') // in progress call
        .mockResolvedValueOnce()
      const spy = vi
        .spyOn(GitHubService.prototype, 'createDeploymentStatus') // live deploy call
        .mockResolvedValueOnce()

      await new Action().run()

      expect(spy).toHaveBeenCalledWith(deploymentID, state)
    })

    test('should create a deployment with failure state if the pre_deploy status is failure', async () => {
      process.env['GITHUB_REPOSITORY'] = 'action/test'
      process.env['GITHUB_REF'] = 'main'
      process.env['INPUT_SERVICE_ID'] = 'my service id'
      process.env['INPUT_API_KEY'] = 'my api key'
      process.env['INPUT_CLEAR_CACHE'] = 'false'
      process.env['INPUT_WAIT_DEPLOY'] = 'true'
      process.env['INPUT_GITHUB_DEPLOYMENT'] = 'true'

      const deploymentID = 1
      const state = DeploymentState.FAILURE
      const serviceURL = 'https://my-service.onrender.com'

      vi
        .spyOn(RenderService.prototype, 'triggerDeploy')
        .mockResolvedValueOnce('id')
      vi
        .spyOn(RenderService.prototype, 'getServiceUrl')
        .mockResolvedValueOnce(serviceURL)
      vi
        .spyOn(RenderService.prototype, 'verifyDeployStatus')
        .mockResolvedValueOnce(RenderDeployStatus.PRE_DEPLOY_FAILED)
      vi
        .spyOn(GitHubService.prototype, 'createDeployment')
        .mockResolvedValueOnce(deploymentID)
      vi
        .spyOn(GitHubService.prototype, 'createDeploymentStatus') // in progress call
        .mockResolvedValueOnce()
      const spy = vi
        .spyOn(GitHubService.prototype, 'createDeploymentStatus') // live deploy call
        .mockResolvedValueOnce()

      await new Action().run()

      expect(spy).toHaveBeenCalledWith(deploymentID, state)
    })
  })
})
