import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConcurrencyController } from '../concurrency-controller'

describe('ConcurrencyController', () => {
  let controller: ConcurrencyController

  beforeEach(() => {
    vi.useFakeTimers()
    controller = new ConcurrencyController({
      maxConcurrent: 2,
      maxQueue: 3,
      timeout: 10,
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
      controller.execute(createDelayTask(100)),
      controller.execute(createDelayTask(100)),
      controller.execute(createDelayTask(100)),
    ]

    // 等待一个时钟周期，让请求开始处理
    await vi.advanceTimersByTimeAsync(0)

    // 前两个任务应该立即执行，第三个任务应该进入队列
    expect(controller.getCurrentConcurrent()).toBe(2)
    expect(controller.getQueueLength()).toBe(1)

    // 等待第一批请求完成
    await vi.advanceTimersByTimeAsync(100)

    // 等待队列中的请求完成
    await vi.advanceTimersByTimeAsync(100)

    // 等待所有 Promise 完成
    const results = await Promise.all(promises)

    // 验证所有任务都返回了正确的结果
    expect(results).toEqual([100, 100, 100])

    // 所有任务完成后，并发数和队列都应该为空
    expect(controller.getCurrentConcurrent()).toBe(0)
    expect(controller.getQueueLength()).toBe(0)
  }, 10000) // 增加超时时间到 10 秒

  it('应该在队列满时拒绝新请求', async () => {
    // 创建一个永不完成的任务
    const createPendingTask = () => () => new Promise(() => {})

    // 填满并发槽和队列
    // 忽略这些 Promise，因为它们永远不会完成
    void controller.execute(createPendingTask()) // 并发1
    void controller.execute(createPendingTask()) // 并发2
    void controller.execute(createPendingTask()) // 队列1
    void controller.execute(createPendingTask()) // 队列2
    void controller.execute(createPendingTask()) // 队列3

    // 等待一个时钟周期，让请求开始处理
    await vi.advanceTimersByTimeAsync(0)

    // 第6个请求应该被拒绝
    await expect(controller.execute(createPendingTask()))
      .rejects
      .toThrow('请求队列已满')
  })

  it('应该在超时时取消请求', async () => {
    const slowTask = () => new Promise(() => {})
    const promise = controller.execute(slowTask)

    // 等待一个时钟周期，让请求开始处理
    await vi.advanceTimersByTimeAsync(0)

    // 前进时间超过超时时间
    await vi.advanceTimersByTimeAsync(1001)

    await expect(promise).rejects.toThrow('请求超时')
  })

  it('应该能清空队列', async () => {
    // 创建一个永不完成的任务
    const createPendingTask = () => () => new Promise(() => {})

    // 填满并发槽和部分队列
    void controller.execute(createPendingTask()) // 并发1
    void controller.execute(createPendingTask()) // 并发2
    const queuedTask = controller.execute(createPendingTask()) // 队列1

    // 等待一个时钟周期，让请求开始处理
    await vi.advanceTimersByTimeAsync(0)

    // 清空队列
    controller.clearQueue()

    // 队列中的任务应该被拒绝
    await expect(queuedTask).rejects.toThrow('请求队列已清空')
    expect(controller.getQueueLength()).toBe(0)
  })
})
