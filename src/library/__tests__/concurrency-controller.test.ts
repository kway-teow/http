import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConcurrencyController } from '../concurrency-controller'

describe('ConcurrencyController', () => {
  let controller: ConcurrencyController

  beforeEach(() => {
    vi.useFakeTimers()
    controller = new ConcurrencyController({
      maxConcurrent: 2,
      maxQueue: 3,
      timeout: 1000,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该使用默认选项创建实例', () => {
    const defaultController = new ConcurrencyController()
    expect(defaultController.getCurrentConcurrent()).toBe(0)
    expect(defaultController.getQueueLength()).toBe(0)
  })

  it('应该限制并发请求数量', async () => {
    // 创建一个延迟的任务
    const createDelayTask = (delay: number) => async () => {
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), delay)
      })
      return delay
    }

    // 同时执行3个请求（超过最大并发数2）
    const promises = [
      controller.execute(createDelayTask(101)),
      controller.execute(createDelayTask(102)),
      controller.execute(createDelayTask(103)),
    ]

    // 等待一个时钟周期，让请求开始处理
    await vi.advanceTimersByTimeAsync(0)

    // 前两个任务应该立即执行，第三个任务应该进入队列
    expect(controller.getCurrentConcurrent()).toBe(2)
    expect(controller.getQueueLength()).toBe(1)

    // 等待第一批请求完成
    await vi.advanceTimersByTimeAsync(102)

    // 等待队列中的请求完成
    await vi.advanceTimersByTimeAsync(103)

    // 等待所有 Promise 完成
    const results = await Promise.all(promises)

    // 验证所有任务都返回了正确的结果
    expect(results).toEqual([101, 102, 103])

    // 所有任务完成后，并发数和队列都应该为空
    expect(controller.getCurrentConcurrent()).toBe(0)
    expect(controller.getQueueLength()).toBe(0)
  }, 1000) // 增加超时时间到 10 秒

  it('应该在队列满时拒绝新请求', async () => {
    // 创建一个永不完成的任务
    const createPendingTask = () => () => new Promise(() => {})

    // 填满并发槽和队列
    // 使用 catch 处理这些永不完成的 Promise 的潜在错误
    controller.execute(createPendingTask()).catch(() => {}) // 并发1
    controller.execute(createPendingTask()).catch(() => {}) // 并发2
    controller.execute(createPendingTask()).catch(() => {}) // 队列1
    controller.execute(createPendingTask()).catch(() => {}) // 队列2
    controller.execute(createPendingTask()).catch(() => {}) // 队列3

    // 等待一个时钟周期，让请求开始处理
    await vi.advanceTimersByTimeAsync(0)

    // 第6个请求应该被拒绝
    await expect(controller.execute(createPendingTask()))
      .rejects
      .toThrow('请求队列已满')
  })

  it('应该在超时时取消请求', async () => {
    // 创建一个明确会超时的任务
    const slowTask = () => new Promise<void>(() => {
      // 这个Promise故意不会resolve
    })

    // 使用更短的超时时间创建控制器
    const timeoutController = new ConcurrencyController({
      maxConcurrent: 2,
      maxQueue: 3,
      timeout: 10, // 10ms超时
    })

    // 启动任务并等待它超时
    const promise = timeoutController.execute(slowTask).catch((error) => {
      expect(error).toMatchObject({ message: '请求超时' })
    })

    // 等待足够的时间让任务超时
    await vi.advanceTimersByTimeAsync(100)
    await promise

    // 清除所有计时器
    vi.clearAllTimers()
  })

  it('应该能清空队列', async () => {
    // 创建一个专门的控制器实例
    const queueController = new ConcurrencyController({
      maxConcurrent: 2,
      maxQueue: 3,
      timeout: 100,
    })

    // 创建一个永不完成的任务
    const createPendingTask = () => () => new Promise(() => {})

    // 填满并发槽，并处理潜在的错误
    queueController.execute(createPendingTask()).catch(() => {}) // 并发1
    queueController.execute(createPendingTask()).catch(() => {}) // 并发2

    // 创建一个进入队列的任务并捕获其Promise
    const queuedTask = queueController.execute(createPendingTask()).catch((error) => {
      expect(error).toMatchObject({ message: '请求队列已清空' })
    })

    // 清空队列
    queueController.clearQueue()

    // 等待足够的时间让任务超时
    await vi.advanceTimersByTimeAsync(200)
    await queuedTask

    // 验证队列长度为0
    expect(queueController.getQueueLength()).toBe(0)

    vi.clearAllTimers()
  })
})
