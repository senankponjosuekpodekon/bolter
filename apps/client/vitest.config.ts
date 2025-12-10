import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // Resolve setup file relative to this config file so npm test works from any CWD
    setupFiles: [path.resolve(__dirname, 'src/setupTests.ts')],
    globals: true,
    // avoid running third-party tests from node_modules (they can crash or pollute the test run)
    // avoid running third-party tests from node_modules and e2e (playwright) tests
    exclude: ['**/node_modules/**', '**/e2e/**', 'dist/**'],
    coverage: {
      // explicit provider required by the vitest types
      provider: 'c8',
      reporter: ['text', 'lcov'],
    },
  },
})
