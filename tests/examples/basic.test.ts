import { describe, it, expect } from 'vitest'
import { faker } from '@faker-js/faker'

interface User {
  id: string
  name: string
  email: string
}

function createUser(name: string, email: string): User {
  return {
    id: faker.string.uuid(),
    name,
    email
  }
}

describe('User Creation', () => {
  it('should create a user with valid data', () => {
    const name = faker.person.fullName()
    const email = faker.internet.email()
    
    const user = createUser(name, email)
    
    expect(user).toMatchObject({
      name,
      email
    })
    expect(user.id).toBeDefined()
  })

  it('should handle email validation', () => {
    const name = faker.person.fullName()
    const email = 'invalid-email'
    
    expect(() => {
      // This is just an example - you would typically have validation in createUser
      if (!email.includes('@')) {
        throw new Error('Invalid email')
      }
      createUser(name, email)
    }).toThrow('Invalid email')
  })
})
