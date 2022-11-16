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

  async triggerDeploy(options: DeployOptions): Promise<void> {
    await this.client.post('/deploys', {
      clearCache: options.clearCache ? 'clear' : 'do_not_clear'
    })
  }
}

interface DeployOptions {
  /** Clear build cache. */
  clearCache?: boolean
  /** Wait until the deployment status is successful. */
  waitDeploy?: boolean
}

interface RenderOptions {
  /** Render API Key. */
  apiKey: string
  /** Render Service ID. */
  serviceId: string
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
