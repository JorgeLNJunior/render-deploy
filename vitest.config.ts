import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'Render deploy',
    clearMocks: true,
    dir: 'tests',
    coverage: {
      exclude: ['src/main.ts'],
      include: ['src/**'],
    },
    testTimeout: 25000
  },
})
