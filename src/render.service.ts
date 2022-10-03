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

  async triggerDeploy(): Promise<void> {
    await this.client.post('/deploys')
  }
}

type RenderOptions = {
  apiKey: string
  serviceId: string
}
