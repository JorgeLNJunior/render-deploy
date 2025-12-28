import axios from 'axios'
import { afterEach,beforeEach, describe, expect, test, vi } from 'vitest'

import {
  RenderDeployStatus,
  RenderService,
} from '../src/render.service.js'

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({ get: mockGet, post: mockPost })),
    },
  }
})

describe('RenderService', () => {
  const serviceId = 'svc_123'
  const apiKey = 'key_abc'
  let service: RenderService

  beforeEach(() => {
    vi.spyOn(axios, 'create').mockClear()
    mockGet.mockReset()
    mockPost.mockReset()
    // noop to satisfy import of wait helper
    service = new RenderService({ apiKey, serviceId })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('verifyDeployStatus returns mapped status', async () => {
    mockGet.mockResolvedValueOnce({ data: { status: 'live' } })
    const status = await service.verifyDeployStatus('deploy_1')
    expect(status).toBe(RenderDeployStatus.LIVE)
    expect(mockGet).toHaveBeenCalledWith('/deploys/deploy_1')
  })

  test('triggerDeploy returns id on 201', async () => {
    mockPost.mockResolvedValueOnce({ status: 201, data: { id: 'd1' } })
    const id = await service.triggerDeploy({ clearCache: false })
    expect(id).toBe('d1')
    expect(mockPost).toHaveBeenCalledWith('/deploys', {
      clearCache: 'do_not_clear',
    })
  })

  test('triggerDeploy handles queued (202) and finds latest after wait', async () => {
    const latest = { id: 'd2' }
    mockPost.mockResolvedValueOnce({ status: 202 })
    // first latestDeployCreatedAfter call
    mockGet.mockResolvedValueOnce({ status: 200, data: [latest] })

    const id = await service.triggerDeploy({ clearCache: true })
    expect(id).toBe('d2')
    expect(mockPost).toHaveBeenCalledWith('/deploys', { clearCache: 'clear' })
    // custom domains path is not involved here; ensure list call
    expect(mockGet).toHaveBeenCalledWith('/deploys', {
      params: { createdAfter: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/) },
    })
  })

  test('triggerDeploy throws on unexpected status', async () => {
    mockPost.mockResolvedValueOnce({ status: 418, data: { foo: 'bar' } })
    await expect(service.triggerDeploy({})).rejects.toThrow(
      /Unexpected response status while triggering a deploy/
    )
  })

  test('latestDeployCreatedAfter throws on non-200', async () => {
    mockGet.mockResolvedValueOnce({ status: 500 })
    await expect((service as unknown as { latestDeployCreatedAfter: (d: string) => Promise<unknown> }).latestDeployCreatedAfter.call(service, 'date')).rejects.toThrow(
      /non 200 response/
    )
  })

  test('getServiceUrl prefers verified custom domain', async () => {
    mockGet
      .mockResolvedValueOnce({
        data: [{ customDomain: { name: 'example.com' } }],
      })
    const url = await service.getServiceUrl()
    expect(url).toBe('https://example.com')
    expect(mockGet).toHaveBeenCalledWith('/custom-domains', {
      params: { verificationStatus: 'verified' },
    })
  })

  test('getServiceUrl falls back to service URL', async () => {
    // custom domain empty
    mockGet
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: { url: 'https://onrender.com/app' } })

    const url = await service.getServiceUrl()
    expect(url).toBe('https://onrender.com/app')
    expect(mockGet).toHaveBeenNthCalledWith(1, '/custom-domains', {
      params: { verificationStatus: 'verified' },
    })
    expect(mockGet).toHaveBeenNthCalledWith(2, '')
  })
})
