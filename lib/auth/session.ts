import 'server-only'
import { cookies } from 'next/headers'
import {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from './jose'
import { prisma } from '@/lib/db'

const ACCESS_TOKEN_COOKIE = 'access_token'
const REFRESH_TOKEN_COOKIE = 'refresh_token'

export async function createSession(userId: string, rememberMe: boolean = false) {
  const cookieStore = await cookies()

  // Create access token (always 15min)
  const accessToken = await createAccessToken(userId)

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60, // 15 minutes
    path: '/',
  })

  // Create refresh token only if "remember me" checked
  if (rememberMe) {
    const refreshToken = await createRefreshToken(userId)

    // Store in database for rotation tracking
    await prisma.session.create({
      data: {
        userId,
        token: refreshToken.jti, // Store jti, not full token
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    })

    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })
  }
}

export async function verifySession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!accessToken) {
    return null
  }

  const payload = await verifyAccessToken(accessToken)
  if (!payload) {
    return null
  }

  return { userId: payload.userId }
}

export async function clearSession() {
  const cookieStore = await cookies()

  // Read session BEFORE deleting cookies
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  // Delete cookies
  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)

  // Invalidate all sessions in database
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken)
    if (payload) {
      await prisma.session.deleteMany({
        where: { userId: payload.userId }
      })
    }
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

  if (!refreshToken) {
    return false
  }

  const payload = await verifyRefreshToken(refreshToken)
  if (!payload) {
    return false
  }

  // Check if token exists in database (not reused)
  const session = await prisma.session.findUnique({
    where: { token: payload.jti }
  })

  if (!session) {
    // Token reuse detected - invalidate all sessions for this user
    await prisma.session.deleteMany({
      where: { userId: payload.userId }
    })
    return false
  }

  // Delete old token (rotation)
  await prisma.session.delete({
    where: { id: session.id }
  })

  // Create new access token
  const newAccessToken = await createAccessToken(payload.userId)

  cookieStore.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  })

  // Create new refresh token (rotation)
  const newRefreshToken = await createRefreshToken(payload.userId)

  await prisma.session.create({
    data: {
      userId: payload.userId,
      token: newRefreshToken.jti,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  cookieStore.set(REFRESH_TOKEN_COOKIE, newRefreshToken.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return true
}
