import { NextRequest, NextResponse } from 'next/server'

import { triggerRealtimeAlert } from '@/lib/alerts/realtime'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const jobs = (body as { jobs?: unknown }).jobs
  if (!Array.isArray(jobs)) {
    return NextResponse.json({ error: 'Invalid body: jobs must be array' }, { status: 400 })
  }

  const results: Array<
    | { userId: string; jobId: string; result: unknown }
    | { userId: string; jobId: string; error: string }
  > = []

  for (const item of jobs) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const { userId, jobId, score } = item as { userId?: unknown; jobId?: unknown; score?: unknown }
    if (typeof userId !== 'string' || typeof jobId !== 'string' || typeof score !== 'number') {
      continue
    }

    try {
      const result = await triggerRealtimeAlert(userId, jobId, score)
      results.push({ userId, jobId, result })
    } catch (error) {
      results.push({
        userId,
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const sent = results.filter((row) => 'result' in row && Boolean((row.result as { sent?: boolean }).sent)).length
  const skipped = results.filter((row) => 'result' in row && Boolean((row.result as { skipped?: boolean }).skipped)).length
  const failed = results.filter((row) => 'error' in row).length

  return NextResponse.json({
    processed: jobs.length,
    sent,
    skipped,
    failed,
    results: results.slice(0, 10),
  })
}
