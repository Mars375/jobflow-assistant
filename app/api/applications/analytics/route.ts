import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const STATUSES = ['BROUILLON', 'EN_ATTENTE', 'ENTRETIEN', 'OFFRE', 'REFUSE'] as const
const RESPONSE_STATUSES = ['ENTRETIEN', 'OFFRE', 'REFUSE'] as const
const RESPONSE_DENOM_STATUSES = ['EN_ATTENTE', 'ENTRETIEN', 'OFFRE', 'REFUSE'] as const

export async function GET() {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.userId

  const [
    totalApplications,
    interviewsCount,
    offersCount,
    numerator,
    denominator,
    grouped,
    responseTimes,
  ] = await Promise.all([
    prisma.jobApplication.count({ where: { userId } }),
    prisma.jobApplication.count({ where: { userId, status: 'ENTRETIEN' } }),
    prisma.jobApplication.count({ where: { userId, status: 'OFFRE' } }),
    prisma.jobApplication.count({
      where: { userId, status: { in: [...RESPONSE_STATUSES] } },
    }),
    prisma.jobApplication.count({
      where: { userId, status: { in: [...RESPONSE_DENOM_STATUSES] } },
    }),
    prisma.jobApplication.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.jobApplication.findMany({
      where: { userId, firstResponseAt: { not: null } },
      select: { appliedAt: true, firstResponseAt: true },
    }),
  ])

  const countsByStatus = STATUSES.reduce<Record<string, number>>((acc, status) => {
    acc[status] = 0
    return acc
  }, {})

  for (const row of grouped) {
    countsByStatus[row.status] = row._count._all
  }

  const responseRate = denominator === 0 ? 0 : numerator / denominator

  const msPerDay = 24 * 60 * 60 * 1000
  const diffs = responseTimes
    .map((row) => {
      const start = row.appliedAt?.getTime()
      const end = row.firstResponseAt?.getTime()
      if (!start || !end) return null
      const diff = end - start
      return diff >= 0 ? diff : null
    })
    .filter((value): value is number => typeof value === 'number')

  const avgTimeToFirstResponseDays =
    diffs.length === 0 ? 0 : diffs.reduce((sum, value) => sum + value, 0) / diffs.length / msPerDay

  return NextResponse.json(
    {
      totalApplications,
      responseRate,
      interviewsCount,
      offersCount,
      avgTimeToFirstResponseDays,
      countsByStatus,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        Vary: 'Cookie',
      },
    }
  )
}
