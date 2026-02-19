'use server'

import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'

export type JobFilters = {
  keyword: string
  location: string
  contractType: string
}

export async function getSavedJobFilters(): Promise<JobFilters> {
  const session = await verifySession()
  if (!session) {
    return { keyword: '', location: '', contractType: '' }
  }

  const filter = await prisma.userJobFilter.findUnique({
    where: { userId: session.userId },
  })

  return {
    keyword: filter?.keyword ?? '',
    location: filter?.location ?? '',
    contractType: filter?.contractType ?? '',
  }
}

export async function saveJobFilters(filters: JobFilters): Promise<JobFilters> {
  const session = await verifySession()
  if (!session) {
    return filters
  }

  const nextFilters = {
    keyword: filters.keyword?.trim() ?? '',
    location: filters.location?.trim() ?? '',
    contractType: filters.contractType?.trim() ?? '',
  }

  await prisma.userJobFilter.upsert({
    where: { userId: session.userId },
    update: nextFilters,
    create: {
      userId: session.userId,
      ...nextFilters,
    },
  })

  return nextFilters
}

export async function markJobAsSeen(jobId: string): Promise<void> {
  const session = await verifySession()
  if (!session || !jobId) return

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
}

export async function markAllJobsAsSeen(): Promise<number> {
  const session = await verifySession()
  if (!session) return 0

  const jobs = await prisma.jobPosting.findMany({ select: { id: true } })

  await Promise.all(
    jobs.map((job) =>
      prisma.userJobState.upsert({
        where: {
          userId_jobId: {
            userId: session.userId,
            jobId: job.id,
          },
        },
        update: { seenAt: new Date() },
        create: {
          userId: session.userId,
          jobId: job.id,
          firstSeenAt: new Date(),
          seenAt: new Date(),
        },
      })
    )
  )

  return jobs.length
}
