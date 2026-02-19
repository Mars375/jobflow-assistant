import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'

export async function GET() {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const unread = await prisma.jobPosting.count({
    where: {
      userStates: {
        none: {
          userId: session.userId,
          seenAt: { not: null },
        },
      },
    },
  })

  return NextResponse.json({ count: unread })
}
