import { beforeAll, afterAll, afterEach } from 'vitest'

// Mock environment variables for testing
process.env.NODE_ENV = 'test'

// Add any global test setup here
beforeAll(() => {
  // Setup database connections, etc.
  return Promise.resolve()
})

afterAll(() => {
  // Cleanup database connections, etc.
  return Promise.resolve()
})

afterEach(() => {
  // Cleanup after each test
  return Promise.resolve()
})
