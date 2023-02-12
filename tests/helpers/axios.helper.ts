import {AxiosError, AxiosRequestHeaders} from 'axios'

export function getAxiosError(status: number): AxiosError<{}, unknown> {
  return new AxiosError(undefined, undefined, undefined, undefined, {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: {
      headers: {} as AxiosRequestHeaders
    }
  })
}
