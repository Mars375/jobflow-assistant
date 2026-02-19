import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'

function requireRedisEnv(name: 'UPSTASH_REDIS_REST_URL' | 'UPSTASH_REDIS_REST_TOKEN'): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not configured`)
  }
  return value
}

// Initialize Redis client
const redis = new Redis({
  url: requireRedisEnv('UPSTASH_REDIS_REST_URL'),
  token: requireRedisEnv('UPSTASH_REDIS_REST_TOKEN'),
})

// Login rate limiter: 5 attempts per 15 minutes per IP
export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:login',
  ephemeralCache: new Map(), // In-memory cache for edge functions
})

// Registration rate limiter: 3 attempts per 1 hour per IP
export const registerRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'ratelimit:register',
  ephemeralCache: new Map(),
})

// Password reset rate limiter: 3 attempts per 15 minutes per IP
export const passwordResetRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '15 m'),
  analytics: true,
  prefix: 'ratelimit:password-reset',
  ephemeralCache: new Map(),
})

// Helper to extract client IP
export function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1' // Fallback
}
