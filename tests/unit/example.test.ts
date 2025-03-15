import { describe, it, expect } from 'vitest'

describe('Example Test Suite', () => {
  it('should perform basic arithmetic', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string operations', () => {
    expect('hello ' + 'world').toBe('hello world')
  })
})
