import axios, {AxiosInstance} from 'axios'

export class RenderService {
  private client: AxiosInstance

  constructor(options: RenderOptions) {
    this.client = axios.create({
      baseURL: `https://api.render.com/v1/services/${options.serviceId}`,
      headers: {
        authorization: `Bearer ${options.apiKey}`
      }
    })
  }

  /**
   * Given a deploy ID, returns its status.
   *
   * @param {string} deployId - The ID of the deploy.
   * @return {Promise<RenderDeployStatus>} A promise that resolves with the deploy status.
   */
  async verifyDeployStatus(deployId: string): Promise<RenderDeployStatus> {
    const response = await this.client.get(`/deploys/${deployId}`)
    return response.data.status as RenderDeployStatus
  }

  /**
   * Triggers a deploy with the given options.
   *
   * @param {DeployOptions} options - The options for the deploy.
   * @return {Promise<string>} - A string representing the ID of the deploy.
   */
  async triggerDeploy(options: DeployOptions): Promise<string> {
    const response = await this.client.post('/deploys', {
      clearCache: options.clearCache ? 'clear' : 'do_not_clear'
    })
    return response.data.id as string
  }

  /**
   * Retrieves the service URL. Suports custom domains.
   *
   * @return {Promise<string>} The service URL.
   */
  async getServiceUrl(): Promise<string> {
    const customDomain = await this.getCustomDomain()
    if (customDomain) return `https://${customDomain}`
    const response = await this.client.get('')
    return response.data.url as string
  }

  /**
   * Retrieves the custom domain associated with the service.
   *
   * @return {Promise<string | undefined>} The custom domain or undefined if not found.
   */
  private async getCustomDomain(): Promise<string | undefined> {
    const response = await this.client.get('/custom-domains', {
      params: {verificationStatus: 'verified'}
    })
    return response.data[0]?.customDomain.name ?? undefined
  }
}

interface DeployOptions {
  /** Clear build cache. */
  clearCache?: boolean
}

interface RenderOptions {
  /** Render API Key. */
  apiKey: string
  /** Render Service ID. */
  serviceId: string
}

export enum RenderDeployStatus {
  CREATED = 'created',
  BUILD_IN_PROGRESS = 'build_in_progress',
  UPDATE_IN_PROGRESS = 'update_in_progress',
  LIVE = 'live',
  DEACTIVATED = 'deactivated',
  BUILD_FAILED = 'build_failed',
  UPLOAD_FAILED = 'update_failed',
  CANCELED = 'canceled'
}

export const RenderErrorResponse = {
  400: 'The request could not be understood by the server.',
  401: 'Authorization information is missing or invalid.',
  403: 'You do not have permissions for the requested resource.',
  404: 'Unable to find the requested resource.',
  406: 'Unable to generate preferred media types as specified by Accept request header.',
  410: 'The requested resource is no longer available.',
  429: 'Rate limit has been surpassed.',
  500: 'An unexpected server error has occurred.',
  503: 'Server currently unavailable.'
}
