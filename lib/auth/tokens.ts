import 'server-only'
import { randomBytes, createHash } from 'crypto'
import { Redis } from '@upstash/redis'

function requireEnv(name: 'UPSTASH_REDIS_REST_URL' | 'UPSTASH_REDIS_REST_TOKEN' | 'TOKEN_SECRET'): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured`)
  }
  return value
}

const redis = new Redis({
  url: requireEnv('UPSTASH_REDIS_REST_URL'),
  token: requireEnv('UPSTASH_REDIS_REST_TOKEN'),
})

const TOKEN_SECRET = requireEnv('TOKEN_SECRET')

// Generate cryptographically secure token
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex')
}

// Hash token for storage (don't store plain tokens!)
export function hashToken(token: string): string {
  return createHash('sha256')
    .update(token)
    .update(TOKEN_SECRET)
    .digest('hex')
}

// Store verification token in Redis with 15-minute expiry
export async function storeVerificationToken(
  email: string,
  token: string,
  expirySeconds: number = 900 // 15 minutes
): Promise<void> {
  const hashed = hashToken(token)
  await redis.set(`verification:${hashed}`, email, {
    ex: expirySeconds
  })
}

// Store password reset token in Redis with 30-minute expiry
export async function storePasswordResetToken(
  email: string,
  token: string
): Promise<void> {
  const hashed = hashToken(token)
  await redis.set(`password-reset:${hashed}`, email, {
    ex: 1800 // 30 minutes
  })
}

// Verify token and return associated email
export async function verifyToken(
  token: string,
  type: 'verification' | 'password-reset' = 'verification'
): Promise<string | null> {
  const hashed = hashToken(token)
  const key = `${type}:${hashed}`

  const email = await redis.get(key) as string | null

  if (email) {
    // One-time use: delete after verification
    await redis.del(key)
    return email
  }

  return null
}
