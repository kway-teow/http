import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/library/__tests__/setup.ts'],
    testTimeout: 20000,
  },
})
