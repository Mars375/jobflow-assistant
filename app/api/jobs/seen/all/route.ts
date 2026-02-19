import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'

export async function POST() {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const jobs = await prisma.jobPosting.findMany({
    select: { id: true },
  })

  const seenState = await prisma.userJobState.findMany({
    where: {
      userId: session.userId,
      jobId: { in: jobs.map((job) => job.id) },
    },
    select: { jobId: true, seenAt: true },
  })

  const seenMap = new Map(seenState.map((row) => [row.jobId, Boolean(row.seenAt)]))
  const unreadJobIds = jobs.filter((job) => !seenMap.get(job.id)).map((job) => job.id)

  if (unreadJobIds.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 })
  }

  const now = new Date()

  await Promise.all(
    unreadJobIds.map((jobId) =>
      prisma.userJobState.upsert({
        where: {
          userId_jobId: {
            userId: session.userId,
            jobId,
          },
        },
        update: { seenAt: now },
        create: {
          userId: session.userId,
          jobId,
          firstSeenAt: now,
          seenAt: now,
        },
      })
    )
  )

  return NextResponse.json({ ok: true, updated: unreadJobIds.length })
}
