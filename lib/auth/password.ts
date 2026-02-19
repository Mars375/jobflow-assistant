import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12 // OWASP recommends 10+

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  return await bcrypt.compare(password, storedHash)
}

export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (password.length > 55) {
    errors.push('Password too long (max 55 characters for bcrypt)')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Must contain uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Must contain lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Must contain number')
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Must contain special character')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
