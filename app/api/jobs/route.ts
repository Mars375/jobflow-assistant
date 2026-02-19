import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { scoreJobRelevance } from '@/lib/jobs/relevance'
import { rankJobsByMatch } from '@/lib/matching/service'

export async function GET(request: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword')?.trim() ?? ''
  const location = searchParams.get('location')?.trim() ?? ''
  const contractType = searchParams.get('contractType')?.trim() ?? ''
  const sort = searchParams.get('sort') === 'match' ? 'match' : 'newest'
  const matchThreshold = Number(searchParams.get('matchThreshold') ?? '0')
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = Math.min(50, Number(searchParams.get('pageSize') ?? '25'))

  const where = {
    ...(keyword
      ? {
          OR: [
            { title: { contains: keyword, mode: 'insensitive' as const } },
            { description: { contains: keyword, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(location
      ? { location: { contains: location, mode: 'insensitive' as const } }
      : {}),
    ...(contractType ? { contractType: { equals: contractType } } : {}),
  }

  const [jobs, profile] = await Promise.all([
    prisma.jobPosting.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (Math.max(page, 1) - 1) * pageSize,
      take: pageSize,
    }),
    prisma.userProfile.findUnique({ where: { userId: session.userId } }),
  ])

  const states = await prisma.userJobState.findMany({
    where: {
      userId: session.userId,
      jobId: { in: jobs.map((job) => job.id) },
    },
    select: { jobId: true, seenAt: true },
  })

  const seenMap = new Map(states.map((state) => [state.jobId, Boolean(state.seenAt)]))
  const profilePayload = profile
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

  let withScore = jobs
    .map((job) => {
      const relevanceScore = scoreJobRelevance(
        {
          title: job.title,
          description: job.description,
          location: job.location,
          contractType: job.contractType,
        },
        profilePayload,
        keyword || undefined
      )

      return {
        ...job,
        relevanceScore,
        isNew: !seenMap.get(job.id),
      }
    })
    .sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      const aPublished = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const bPublished = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return bPublished - aPublished
    })

  if (sort === 'match') {
    const ranked = await rankJobsByMatch(session.userId, {
      threshold: Number.isFinite(matchThreshold) ? Math.max(0, matchThreshold) : 0,
      limit: pageSize,
    })

    const scoreMap = new Map(ranked.map((item) => [item.jobId, item]))

    withScore = withScore
      .map((job) => {
        const match = scoreMap.get(job.id)
        return {
          ...job,
          matchScore: match?.score,
          matchMethod: match?.method,
        }
      })
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
  }

  return NextResponse.json({
    filters: { keyword, location, contractType, sort, matchThreshold },
    page,
    pageSize,
    jobs: withScore,
  })
}
