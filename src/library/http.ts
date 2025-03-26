export class Http {
  private baseUrl: string
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  get(url: string) {
    return fetch(`${this.baseUrl}${url}`)
  }
}
