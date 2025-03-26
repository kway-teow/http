import { vi } from 'vitest'

// 确保全局对象存在
global.window = global.window || {}
global.localStorage = global.localStorage || {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
}
