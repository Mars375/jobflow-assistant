import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { recomputeCvEmbedding } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(_request: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const result = await recomputeCvEmbedding(session.userId)
    return NextResponse.json({
      ...result,
      message: 'CV embedding recomputed',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === 'CV not found') {
      return NextResponse.json({ error: 'Please complete your profile first' }, { status: 400 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
