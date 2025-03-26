import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'KwayTeowHttp',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        preserveModules: true,
        preserveModulesRoot: 'src/index',
        entryFileNames: '[name].js',
      },
    },
  },
  plugins: [dts({
    exclude: ['**/*.test.ts', '**/*.spec.ts', '**/test/**'],
  })],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'istanbul', // or 'v8'
      include: ['src/index/**/*.ts'],
      exclude: ['src/index/**/*.test.ts', 'src/index/**/*.spec.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
