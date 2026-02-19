import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { sendDigestToUser } from '@/lib/email/digest'
import { getDigestTargetTime, isDigestTooLate } from '@/lib/alerts/timezone'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      emailVerified: { not: null },
    },
    include: { notifications: true },
  })

  const results: Array<{ email: string; result: unknown } | { email: string; error: string }> = []

  for (const user of users) {
    const timezone = user.notifications?.timezone ?? 'Europe/Paris'
    const targetTime = getDigestTargetTime(timezone)
    if (targetTime > now) {
      continue
    }

    if (isDigestTooLate(targetTime)) {
      results.push({ email: user.email, result: { skipped: true, reason: 'Too late for today' } })
      continue
    }

    try {
      const result = await sendDigestToUser(user.id)
      results.push({ email: user.email, result })
    } catch (error) {
      results.push({
        email: user.email,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const sentCount = results.filter((item) => {
    if (!('result' in item)) return false
    return Boolean((item.result as { sent?: boolean }).sent)
  }).length
  const skippedCount = results.filter((item) => {
    if (!('result' in item)) return false
    return Boolean((item.result as { skipped?: boolean }).skipped)
  }).length
  const failedCount = results.filter((item) => 'error' in item).length

  return NextResponse.json({
    processed: users.length,
    eligible: results.length,
    sent: sentCount,
    skipped: skippedCount,
    failed: failedCount,
    results: results.slice(0, 10),
  })
}
