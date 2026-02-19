import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { calculateJobMatch } from '@/lib/matching/service'

type Params = {
  params: { id: string }
}

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const result = await calculateJobMatch(session.userId, params.id)
    return NextResponse.json(result.explanation)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to calculate match'

    if (message === 'User profile not found') {
      return NextResponse.json({ error: 'Please complete your profile first' }, { status: 400 })
    }

    if (message === 'Job not found') {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
