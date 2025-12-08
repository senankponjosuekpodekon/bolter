import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // Ensure this config resolves the setup file regardless of current working dir
    setupFiles: [path.resolve(process.cwd(), 'apps/client/src/setupTests.ts')],
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
