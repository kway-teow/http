import ky, { KyInstance, Options as KyOptions } from 'ky'
import { ConcurrencyController, ConcurrencyOptions } from './concurrency-controller'

export interface HttpOptions extends KyOptions {
  /** 基础 URL */
  baseUrl?: string
  /** 并发控制选项 */
  concurrency?: ConcurrencyOptions
}

/**
 * HTTP 客户端类
 * 基于 ky 实现，支持并发控制、自动 JSON 解析等功能
 */
export class Http {
  private readonly client: KyInstance
  private readonly baseUrl: string
  private readonly concurrencyController: ConcurrencyController

  constructor(options: HttpOptions = {}) {
    const { baseUrl = '', concurrency, ...kyOptions } = options
    this.baseUrl = baseUrl
    this.client = ky.create({
      prefixUrl: baseUrl,
      retry: 0, // 禁用重试，因为我们自己处理并发
      ...kyOptions,
    })
    this.concurrencyController = new ConcurrencyController(concurrency)
  }

  /**
   * 发送 GET 请求
   * @param url - 请求的 URL
   * @param options - 请求的额外选项
   * @returns 返回解析后的响应数据
   */
  async get<T = unknown>(url: string, options?: KyOptions): Promise<T> {
    return this.concurrencyController.execute(async () => {
      try {
        return await this.client.get(url, options).json<T>()
      }
      catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('请求失败')
      }
    })
  }

  /**
   * 发送 POST 请求
   * @param url - 请求的 URL
   * @param options - 请求的额外选项
   * @returns 返回解析后的响应数据
   */
  async post<T = unknown>(url: string, options?: KyOptions): Promise<T> {
    return this.concurrencyController.execute(async () => {
      try {
        return await this.client.post(url, options).json<T>()
      }
      catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('请求失败')
      }
    })
  }

  /**
   * 发送 PUT 请求
   * @param url - 请求的 URL
   * @param options - 请求的额外选项
   * @returns 返回解析后的响应数据
   */
  async put<T = unknown>(url: string, options?: KyOptions): Promise<T> {
    return this.concurrencyController.execute(async () => {
      try {
        return await this.client.put(url, options).json<T>()
      }
      catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('请求失败')
      }
    })
  }

  /**
   * 发送 DELETE 请求
   * @param url - 请求的 URL
   * @param options - 请求的额外选项
   * @returns 返回解析后的响应数据
   */
  async delete<T = unknown>(url: string, options?: KyOptions): Promise<T> {
    return this.concurrencyController.execute(async () => {
      try {
        return await this.client.delete(url, options).json<T>()
      }
      catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('请求失败')
      }
    })
  }

  /**
   * 发送 PATCH 请求
   * @param url - 请求的 URL
   * @param options - 请求的额外选项
   * @returns 返回解析后的响应数据
   */
  async patch<T = unknown>(url: string, options?: KyOptions): Promise<T> {
    return this.concurrencyController.execute(async () => {
      try {
        return await this.client.patch(url, options).json<T>()
      }
      catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('请求失败')
      }
    })
  }

  /**
   * 发送 HEAD 请求
   * @param url - 请求的 URL
   * @param options - 请求的额外选项
   * @returns 返回响应对象
   */
  async head(url: string, options?: KyOptions): Promise<Response> {
    return this.concurrencyController.execute(async () => {
      try {
        return await this.client.head(url, options)
      }
      catch (error) {
        if (error instanceof Error) {
          throw error
        }
        throw new Error('请求失败')
      }
    })
  }

  /**
   * 获取当前并发请求数
   */
  getCurrentConcurrent(): number {
    return this.concurrencyController.getCurrentConcurrent()
  }

  /**
   * 获取当前等待队列长度
   */
  getQueueLength(): number {
    return this.concurrencyController.getQueueLength()
  }

  /**
   * 清空请求队列
   * 会导致队列中的请求被拒绝
   */
  clearQueue(): void {
    this.concurrencyController.clearQueue()
  }
}
