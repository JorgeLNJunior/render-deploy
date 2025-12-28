import { afterEach,beforeEach, describe, expect, test, vi } from 'vitest'

import { DeploymentState, GitHubService } from '../src/github.service.js'

const mockRest = {
  repos: {
    createDeployment: vi.fn(),
    createDeploymentStatus: vi.fn(),
  },
}

vi.mock('octokit', () => {
  class MockOctokit {
    rest = mockRest
    constructor(opts: { auth: string }) { void opts }
  }
  return { Octokit: MockOctokit }
})

describe('GitHubService', () => {
  const cfg = { githubToken: 't', owner: 'o', repo: 'r' }
  let gh: GitHubService

  beforeEach(() => {
    vi.clearAllMocks()
    gh = new GitHubService(cfg)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('createDeployment returns id on 201', async () => {
    mockRest.repos.createDeployment.mockResolvedValueOnce({ status: 201, data: { id: 99 } })
    const id = await gh.createDeployment('main', 'production')
    expect(id).toBe(99)
    expect(mockRest.repos.createDeployment).toHaveBeenCalledWith({
      owner: 'o',
      repo: 'r',
      production_environment: true,
      required_contexts: [],
      environment: 'production',
      ref: 'main',
    })
  })

  test('createDeployment throws on non-201', async () => {
    mockRest.repos.createDeployment.mockResolvedValueOnce({ status: 400, data: { message: 'bad' } })
    await expect(gh.createDeployment('main')).rejects.toThrow(/github api error/)
  })

  test('createDeploymentStatus sends payload', async () => {
    mockRest.repos.createDeploymentStatus.mockResolvedValueOnce({})
    await gh.createDeploymentStatus(1, DeploymentState.SUCCESS, 'https://app')
    expect(mockRest.repos.createDeploymentStatus).toHaveBeenCalledWith({
      owner: 'o',
      repo: 'r',
      deployment_id: 1,
      environment_url: 'https://app',
      state: DeploymentState.SUCCESS,
    })
  })
})
