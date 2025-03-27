/**
 * 用于管理并发请求的任务项
 */
interface QueueItem<T> {
  task: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

/**
 * 并发控制器的配置选项
 */
export interface ConcurrencyOptions {
  /** 最大并发数 */
  maxConcurrent?: number
  /** 队列最大长度，超过后将拒绝新的请求 */
  maxQueue?: number
  /** 单个请求超时时间(ms) */
  timeout?: number
}

/**
 * 并发控制器
 * 用于管理 HTTP 请求的并发数量，支持请求排队、超时控制等功能
 */
export class ConcurrencyController {
  private readonly maxConcurrent: number
  private readonly maxQueue: number
  private readonly timeout: number
  private currentConcurrent: number = 0
  private queue: QueueItem<unknown>[] = []

  constructor(options: ConcurrencyOptions = {}) {
    this.maxConcurrent = options.maxConcurrent ?? 5
    this.maxQueue = options.maxQueue ?? 100
    this.timeout = options.timeout ?? 30000
  }

  /**
   * 执行一个受并发控制的异步任务
   * @param task - 要执行的异步任务
   * @returns 任务执行的结果
   * @throws 当队列已满或请求超时时抛出错误
   */
  async execute<T>(task: () => Promise<T>): Promise<T> {
    // 如果当前并发数小于最大并发数，直接执行
    if (this.currentConcurrent < this.maxConcurrent) {
      return this.runTask(task)
    }

    // 如果队列已满，拒绝请求
    if (this.queue.length >= this.maxQueue) {
      throw new Error('请求队列已满')
    }

    // 将任务加入队列
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task,
        resolve: resolve as (value: unknown) => void,
        reject,
      })
    })
  }

  /**
   * 执行任务并处理并发计数
   * @param task - 要执行的异步任务
   * @returns 任务执行的结果
   */
  private async runTask<T>(task: () => Promise<T>): Promise<T> {
    this.currentConcurrent++

    try {
      // 创建一个超时 Promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject('请求超时'), this.timeout)
      })

      // 使用 Promise.race 实现超时控制
      const result = await Promise.race([task(), timeoutPromise])

      return result
    }
    finally {
      this.currentConcurrent--
      this.processQueue()
    }
  }

  /**
   * 处理队列中的下一个任务
   */
  private processQueue(): void {
    if (this.queue.length === 0 || this.currentConcurrent >= this.maxConcurrent) {
      return
    }

    const item = this.queue.shift()
    if (item) {
      this.runTask(item.task)
        .then(item.resolve)
        .catch(item.reject)
    }
  }

  /**
   * 获取当前并发数
   */
  getCurrentConcurrent(): number {
    return this.currentConcurrent
  }

  /**
   * 获取当前队列长度
   */
  getQueueLength(): number {
    return this.queue.length
  }

  /**
   * 清空请求队列
   */
  clearQueue(): void {
    this.queue.forEach((item) => {
      item.reject(new Error('请求队列已清空'))
    })
    this.queue = []
  }
}
