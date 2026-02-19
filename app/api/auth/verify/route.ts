import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/tokens'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(
      new URL('/auth/verify?status=missing', request.url)
    )
  }

  const email = await verifyToken(token)

  if (!email) {
    return NextResponse.redirect(
      new URL('/auth/verify?status=invalid', request.url)
    )
  }

  // Mark user as verified
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() }
  })

  return NextResponse.redirect(
    new URL('/auth/verify/success', request.url)
  )
}
