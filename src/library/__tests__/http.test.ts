import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Http } from '../http'

describe('Http', () => {
  let http: Http

  beforeEach(() => {
    vi.useFakeTimers()
    http = new Http({
      baseUrl: 'https://api.example.com',
      concurrency: {
        maxConcurrent: 2,
        maxQueue: 3,
        timeout: 10,
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('应该正确处理 GET 请求', async () => {
    const mockData = { id: 1, name: 'test' }
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    const result = await http.get('users/1')
    expect(result).toEqual(mockData)
  })

  it('应该正确处理 POST 请求', async () => {
    const mockData = { id: 1, name: 'test' }
    const requestData = { name: 'test' }

    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    const result = await http.post('users', {
      json: requestData,
    })

    expect(result).toEqual(mockData)
  })

  it('应该正确处理并发限制', async () => {
    const mockData = { success: true }
    let requestCount = 0

    // 模拟一个延迟的响应，使用较短的延迟时间
    global.fetch = vi.fn().mockImplementation(() => {
      requestCount++
      return new Promise(resolve => setTimeout(() => {
        resolve(new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }, 10)) // 将延迟从 100ms 减少到 10ms
    })

    // 同时发起多个请求
    const requests = Array(5).fill(null).map(() =>
      http.get('test'),
    )

    // 等待一个时钟周期，让请求开始处理
    await vi.advanceTimersByTimeAsync(1)

    // 检查当前并发数和队列长度
    expect(http.getCurrentConcurrent()).toBe(2)
    expect(http.getQueueLength()).toBe(3)

    // 等待第一批请求完成
    await vi.advanceTimersByTimeAsync(10)

    // 等待队列中的请求完成
    await vi.advanceTimersByTimeAsync(20)

    // 等待所有请求完成
    await Promise.all(requests)

    // 验证所有请求都被处理
    expect(requestCount).toBe(5)
    expect(http.getCurrentConcurrent()).toBe(0)
    expect(http.getQueueLength()).toBe(0)
  }, 1000) // 增加测试超时时间到 10 秒

  it('应该正确处理请求超时', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(new Response()), 10)),
    )

    const promise = http.get('slow')
    await vi.advanceTimersByTimeAsync(100)
    await expect(promise).rejects.toThrow('请求超时')
  })

  it('应该正确处理 HEAD 请求', async () => {
    const mockResponse = new Response(null, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const response = await http.head('test')
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })

  it('应该能清空请求队列', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(() => {
        resolve(new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }, 10)),
    )

    // 发起多个请求填满队列
    const requests = Array(5).fill(null).map(() =>
      http.get('test').catch(() => {}),
    )

    // 等待一个时钟周期，让请求开始处理
    await vi.advanceTimersByTimeAsync(0)

    // 清空队列
    http.clearQueue()

    // 验证队列已清空
    expect(http.getQueueLength()).toBe(0)

    // 等待所有请求完成（被拒绝）
    await Promise.all(requests)
  })

  it('应该正确处理请求错误', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('网络错误'))

    await expect(http.get('error')).rejects.toThrow('网络错误')
  })
})
