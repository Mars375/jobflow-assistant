import 'server-only'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

// Environment variables (type-safe)
const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production-min-32-chars'
)
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production-min-32-chars'
)

// Token payloads
export interface AccessPayload extends JWTPayload {
  userId: string
  type: 'access'
}

export interface RefreshPayload extends JWTPayload {
  userId: string
  type: 'refresh'
  jti: string // Unique token ID for rotation tracking
}

// Create access token (15 minutes)
export async function createAccessToken(userId: string): Promise<string> {
  return await new SignJWT({ userId, type: 'access' } satisfies Pick<AccessPayload, 'userId' | 'type'>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('urn:jobflow:issuer')
    .setAudience('urn:jobflow:audience')
    .setExpirationTime('15m')
    .sign(ACCESS_SECRET)
}

// Create refresh token (7 days)
export async function createRefreshToken(userId: string): Promise<{
  token: string
  jti: string
}> {
  const jti = crypto.randomUUID()
  const token = await new SignJWT({
    userId,
    type: 'refresh',
    jti
  } satisfies Pick<RefreshPayload, 'userId' | 'type' | 'jti'>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('urn:jobflow:issuer')
    .setAudience('urn:jobflow:audience')
    .setExpirationTime('7d')
    .setJti(jti)
    .sign(REFRESH_SECRET)

  return { token, jti }
}

// Verify access token
export async function verifyAccessToken(token: string): Promise<AccessPayload | null> {
  try {
    const { payload } = await jwtVerify<AccessPayload>(token, ACCESS_SECRET, {
      issuer: 'urn:jobflow:issuer',
      audience: 'urn:jobflow:audience',
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}

// Verify refresh token
export async function verifyRefreshToken(token: string): Promise<RefreshPayload | null> {
  try {
    const { payload } = await jwtVerify<RefreshPayload>(token, REFRESH_SECRET, {
      issuer: 'urn:jobflow:issuer',
      audience: 'urn:jobflow:audience',
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}
