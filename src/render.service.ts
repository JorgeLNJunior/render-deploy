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

type DeployOptions = {
  clearCache: boolean
}

type RenderOptions = {
  apiKey: string
  serviceId: string
}
