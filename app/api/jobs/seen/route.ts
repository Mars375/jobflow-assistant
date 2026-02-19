import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const jobId = typeof body?.jobId === 'string' ? body.jobId : ''

  if (!jobId) {
    return NextResponse.json({ error: 'jobId manquant' }, { status: 400 })
  }

  await prisma.userJobState.upsert({
    where: {
      userId_jobId: {
        userId: session.userId,
        jobId,
      },
    },
    update: {
      seenAt: new Date(),
    },
    create: {
      userId: session.userId,
      jobId,
      firstSeenAt: new Date(),
      seenAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
