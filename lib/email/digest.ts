import 'server-only'

import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { ALERT_RATE_LIMITS, EMAIL_DIGEST_SETTINGS } from '@/lib/alerts/schema'
import { cosineSimilarity, keywordMatchScore, similarityToScore } from '@/lib/matching/scoring'
import { generateJobDigestEmail } from '@/lib/email/templates'

type ProfileRow = {
  skills: unknown
  experience: unknown
  embedding: string | null
}

type JobRow = {
  id: string
  title: string
  company: string | null
  location: string | null
  contractType: string | null
  salaryText: string | null
  publishedAt: Date | null
  createdAt: Date
  url: string | null
  description: string | null
  embedding: string | null
}

export type DigestJob = {
  id: string
  title: string
  company: string | null
  location: string | null
  contractType: string | null
  salaryText: string | null
  publishedAt: Date | null
  url: string | null
  matchScore: number
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function toExperienceString(value: unknown): string {
  if (!Array.isArray(value)) {
    return ''
  }

  return value
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return ''
      }

      return Object.values(entry as Record<string, unknown>)
        .filter((item): item is string => typeof item === 'string')
        .join(' ')
    })
    .filter(Boolean)
    .join(' ')
}

function parseVector(vectorText: string | null): number[] | null {
  if (!vectorText) {
    return null
  }

  const normalized = vectorText.trim().replace(/^\[/, '').replace(/\]$/, '')
  if (!normalized) {
    return null
  }

  const values = normalized.split(',').map((value) => Number(value.trim()))
  if (values.some((value) => Number.isNaN(value))) {
    return null
  }

  return values
}

async function getProfileForDigest(userId: string): Promise<ProfileRow | null> {
  const profiles = await prisma.$queryRaw<ProfileRow[]>`
    SELECT
      "skills",
      "experience",
      "embedding"::text AS "embedding"
    FROM "UserProfile"
    WHERE "userId" = ${userId}
    LIMIT 1
  `

  return profiles[0] ?? null
}

export function groupJobsByTier(jobs: DigestJob[]) {
  const tiers = {
    excellent: [] as DigestJob[],
    good: [] as DigestJob[],
  }

  for (const job of jobs) {
    if (job.matchScore >= EMAIL_DIGEST_SETTINGS.SCORE_TIERS.EXCELLENT.min) {
      tiers.excellent.push(job)
      continue
    }

    if (job.matchScore >= EMAIL_DIGEST_SETTINGS.SCORE_TIERS.GOOD.min) {
      tiers.good.push(job)
    }
  }

  return tiers
}

async function getDigestJobs(userId: string, lastSentAt: Date | null): Promise<DigestJob[]> {
  const since = lastSentAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000)
  const profile = await getProfileForDigest(userId)
  if (!profile) {
    return []
  }

  const jobs = await prisma.$queryRaw<JobRow[]>`
    SELECT
      jp."id",
      jp."title",
      jp."company",
      jp."location",
      jp."contractType",
      jp."salaryText",
      jp."publishedAt",
      jp."createdAt",
      jp."url",
      jp."description",
      jp."embedding"::text AS "embedding"
    FROM "JobPosting" jp
    WHERE (
      (jp."publishedAt" IS NOT NULL AND jp."publishedAt" >= ${since})
      OR (jp."publishedAt" IS NULL AND jp."createdAt" >= ${since})
    )
      AND NOT EXISTS (
        SELECT 1 FROM "SentAlert" sa
        WHERE sa."userId" = ${userId}
          AND sa."jobId" = jp."id"
          AND sa."alertType" = 'EMAIL_DIGEST'
      )
    ORDER BY jp."publishedAt" DESC NULLS LAST, jp."createdAt" DESC
    LIMIT 250
  `

  const cvSkills = toStringArray(profile.skills)
  const cvExperience = toExperienceString(profile.experience)
  const profileEmbedding = parseVector(profile.embedding)

  const scored = jobs
    .map((job) => {
      const jobText = `${job.title} ${job.description ?? ''} ${cvExperience}`
      const jobEmbedding = parseVector(job.embedding)

      let score = keywordMatchScore(cvSkills, jobText)
      if (profileEmbedding && jobEmbedding && profileEmbedding.length === jobEmbedding.length) {
        score = similarityToScore(cosineSimilarity(profileEmbedding, jobEmbedding))
      }

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        contractType: job.contractType,
        salaryText: job.salaryText,
        publishedAt: job.publishedAt,
        url: job.url,
        matchScore: score,
      }
    })
    .filter((job) => job.matchScore >= ALERT_RATE_LIMITS.BATCHED_SCORE_THRESHOLD)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, EMAIL_DIGEST_SETTINGS.MAX_JOBS)

  return scored
}

export async function sendDigestToUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notifications: true },
  })

  if (!user) {
    return { skipped: true, reason: 'User not found' }
  }

  const notifications =
    user.notifications ??
    (await prisma.userNotification.create({
      data: {
        userId: user.id,
      },
    }))

  if (!notifications.emailDigestEnabled) {
    return { skipped: true, reason: 'Email digest disabled' }
  }

  const now = new Date()
  if (notifications.emailDigestLastSent) {
    const hoursSince = (now.getTime() - notifications.emailDigestLastSent.getTime()) / (1000 * 60 * 60)
    if (hoursSince < 20) {
      return { skipped: true, reason: 'Already sent today' }
    }
  }

  const jobs = await getDigestJobs(userId, notifications.emailDigestLastSent)
  if (jobs.length === 0) {
    return { skipped: true, reason: 'No new jobs' }
  }

  const tiers = groupJobsByTier(jobs)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobflow-assistant.com'
  const firstName = user.name?.split(' ')[0] || 'Bonjour'

  const { html, text } = await generateJobDigestEmail({
    firstName,
    tiers,
    totalJobs: jobs.length,
    hasMore: false,
    appUrl,
  })

  const sendResult = await sendEmail({
    to: user.email,
    subject: `${jobs.length} nouvelles offres d'emploi correspondantes`,
    html,
    text,
  })

  if (!sendResult.success) {
    return { error: true, message: sendResult.error || 'Failed to send email' }
  }

  await prisma.sentAlert.createMany({
    data: jobs.map((job) => ({
      userId,
      jobId: job.id,
      alertType: 'EMAIL_DIGEST',
    })),
    skipDuplicates: true,
  })

  await prisma.userNotification.update({
    where: { userId },
    data: { emailDigestLastSent: now },
  })

  return { sent: true, jobsCount: jobs.length, emailId: sendResult.emailId }
}
