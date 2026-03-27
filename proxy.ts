import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { loginRateLimiter, registerRateLimiter } from './lib/rate-limit'

const protectedRoutes = ['/dashboard', '/account', '/mon-compte', '/profile', '/jobs', '/applications']

function isExactOrSegmentMatch(path: string, route: string): boolean {
  return path === route || path.startsWith(`${route}/`)
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Rate limit auth API routes
  if (path.startsWith('/api/auth/login')) {
    const identifier = getClientIPFromRequest(request)
    const { success, limit, remaining, reset } = await loginRateLimiter.limit(identifier)

    if (!success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString()
          }
        }
      )
    }
  }

  if (path.startsWith('/api/auth/register')) {
    const identifier = getClientIPFromRequest(request)
    const { success } = await registerRateLimiter.limit(identifier)

    if (!success) {
      return NextResponse.json(
        { error: "Trop de tentatives d'inscription. Réessayez plus tard." },
        { status: 429 }
      )
    }
  }

  // Skip API routes and static files for auth checks
  if (path.startsWith('/api') || path.startsWith('/_next') || path.includes('.')) {
    return NextResponse.next()
  }

  // Auth route protection with JWT signature verification
  const isProtectedRoute = protectedRoutes.some(route => isExactOrSegmentMatch(path, route))
  const isAuthRoute = path === '/login' || path === '/register' || isExactOrSegmentMatch(path, '/register')

  const accessToken = request.cookies.get('access_token')?.value
  let isAuthenticated = false

  if (accessToken) {
    // NOTE: Cannot import from 'server-only' modules in proxy (nodejs runtime).
    // Use jose directly here for JWT verification.
    try {
      const { jwtVerify } = await import('jose')
      const secret = new TextEncoder().encode(
        process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production-min-32-chars'
      )
      await jwtVerify(accessToken, secret, {
        issuer: 'urn:jobflow:issuer',
        audience: 'urn:jobflow:audience',
        algorithms: ['HS256'],
      })
      isAuthenticated = true
    } catch {
      isAuthenticated = false
    }
  }

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

function getClientIPFromRequest(request: NextRequest): string {
  return request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || '127.0.0.1'
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
}
