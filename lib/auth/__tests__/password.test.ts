import { describe, it, expect } from 'vitest'
import { validatePasswordStrength } from '../password'

describe('validatePasswordStrength', () => {
  it('returns valid for a password meeting all requirements', () => {
    const result = validatePasswordStrength('Secure#Pass1')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when password is shorter than 8 characters', () => {
    const result = validatePasswordStrength('Ab1!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must be at least 8 characters')
  })

  it('fails when password is longer than 55 characters', () => {
    const long = 'Aa1!' + 'x'.repeat(53) // 57 chars total
    const result = validatePasswordStrength(long)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password too long (max 55 characters for bcrypt)')
  })

  it('passes for a password that is exactly 8 characters', () => {
    const result = validatePasswordStrength('Abcde1!x')
    expect(result.valid).toBe(true)
  })

  it('passes for a password that is exactly 55 characters', () => {
    const exact = 'Aa1!' + 'x'.repeat(51) // 55 chars
    const result = validatePasswordStrength(exact)
    expect(result.valid).toBe(true)
  })

  it('fails when password has no uppercase letter', () => {
    const result = validatePasswordStrength('secure#pass1')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Must contain uppercase letter')
  })

  it('fails when password has no lowercase letter', () => {
    const result = validatePasswordStrength('SECURE#PASS1')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Must contain lowercase letter')
  })

  it('fails when password has no digit', () => {
    const result = validatePasswordStrength('Secure#Pass')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Must contain number')
  })

  it('fails when password has no special character', () => {
    const result = validatePasswordStrength('SecurePass1')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Must contain special character')
  })

  it('returns multiple errors when multiple requirements are unmet', () => {
    // lowercase only: missing uppercase, digit, special char
    const result = validatePasswordStrength('alllowercase')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Must contain uppercase letter')
    expect(result.errors).toContain('Must contain number')
    expect(result.errors).toContain('Must contain special character')
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })

  it('returns both length and content errors for a very weak short password', () => {
    const result = validatePasswordStrength('abc')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password must be at least 8 characters')
    expect(result.errors).toContain('Must contain uppercase letter')
    expect(result.errors).toContain('Must contain number')
    expect(result.errors).toContain('Must contain special character')
  })
})
