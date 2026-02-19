import { NextRequest, NextResponse } from 'next/server'
import { generateJobEmbeddings } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const limit = Number(body?.limit ?? 100)
    const result = await generateJobEmbeddings({
      limit: Number.isFinite(limit) ? Math.max(1, Math.min(500, limit)) : 100,
    })

    return NextResponse.json({
      ...result,
      message: 'Job embeddings generated',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
