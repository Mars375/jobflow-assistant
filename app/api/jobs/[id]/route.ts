import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { scoreJobRelevance } from '@/lib/jobs/relevance'

type Params = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const [job, profile, state] = await Promise.all([
    prisma.jobPosting.findUnique({ where: { id } }),
    prisma.userProfile.findUnique({ where: { userId: session.userId } }),
    prisma.userJobState.findUnique({
      where: {
        userId_jobId: {
          userId: session.userId,
          jobId: id,
        },
      },
    }),
  ])

  if (!job) {
    return NextResponse.json({ error: 'Offre introuvable' }, { status: 404 })
  }

  const relevanceScore = scoreJobRelevance(
    {
      title: job.title,
      description: job.description,
      location: job.location,
      contractType: job.contractType,
    },
    profile
      ? {
          skills: Array.isArray(profile.skills) ? (profile.skills as string[]) : [],
          experience: Array.isArray(profile.experience)
            ? (profile.experience as Array<Record<string, string>>)
            : [],
          education: Array.isArray(profile.education)
            ? (profile.education as Array<Record<string, string>>)
            : [],
          contact: (profile.contact as Record<string, string>) ?? {},
        }
      : null
  )

  return NextResponse.json({
    ...job,
    relevanceScore,
    isNew: !state?.seenAt,
  })
}
