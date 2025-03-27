import { vi } from 'vitest'

// 确保全局有 fetch
if (!global.fetch) {
  global.fetch = vi.fn()
}

// 确保全局有 Response 和 Headers
if (!global.Response) {
  global.Response = class Response {
    ok: boolean
    status: number
    headers: Headers
    private body: any

    constructor(body: any, init?: ResponseInit) {
      this.body = body
      this.ok = init?.status ? init.status >= 200 && init.status < 300 : true
      this.status = init?.status || 200
      this.headers = new Headers(init?.headers)
    }

    clone(): Response {
      return new Response(this.body, {
        status: this.status,
        headers: this.headers,
      })
    }

    async json<T>() {
      return this.body as T
    }

    async text() {
      return String(this.body)
    }

    async blob() {
      return new Blob([this.body])
    }

    async arrayBuffer() {
      return new ArrayBuffer(0)
    }

    async formData() {
      return new FormData()
    }
  } as any
}

if (!global.Headers) {
  global.Headers = class Headers {
    private headers: Map<string, string>

    constructor(init?: Record<string, string> | Headers) {
      this.headers = new Map()
      if (init) {
        if (init instanceof Headers) {
          Array.from(init.entries()).forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), value)
          })
        }
        else {
          Object.entries(init).forEach(([key, value]) => {
            this.headers.set(key.toLowerCase(), value)
          })
        }
      }
    }

    get(name: string): string | null {
      return this.headers.get(name.toLowerCase()) || null
    }

    set(name: string, value: string): void {
      this.headers.set(name.toLowerCase(), value)
    }

    append(name: string, value: string): void {
      const existing = this.get(name)
      this.set(name, existing ? `${existing}, ${value}` : value)
    }

    delete(name: string): void {
      this.headers.delete(name.toLowerCase())
    }

    has(name: string): boolean {
      return this.headers.has(name.toLowerCase())
    }

    entries(): IterableIterator<[string, string]> {
      return this.headers.entries()
    }

    keys(): IterableIterator<string> {
      return this.headers.keys()
    }

    values(): IterableIterator<string> {
      return this.headers.values()
    }

    forEach(callback: (value: string, key: string) => void): void {
      this.headers.forEach((value, key) => callback(value, key))
    }
  } as any
}

// 确保全局有 Blob
if (!global.Blob) {
  global.Blob = class Blob {
    private content: any[]

    constructor(parts: any[] = []) {
      this.content = parts
    }

    size(): number {
      return this.content.length
    }

    type(): string {
      return 'application/octet-stream'
    }
  } as any
}

// 确保全局有 FormData
if (!global.FormData) {
  global.FormData = class FormData {
    private data: Map<string, string | Blob>

    constructor() {
      this.data = new Map()
    }

    append(name: string, value: string | Blob): void {
      this.data.set(name, value)
    }

    get(name: string): string | Blob | null {
      return this.data.get(name) || null
    }
  } as any
}
