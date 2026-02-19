import { prisma } from '@/lib/db'
import { cosineSimilarity, keywordMatchScore, similarityToScore } from '@/lib/matching/scoring'
import { explainMatch, type MatchExplanation } from '@/lib/matching/explanation'

export interface JobMatchScore {
  jobId: string
  score: number
  explanation: MatchExplanation
  method: 'semantic' | 'keyword'
}

type JobWithEmbedding = {
  id: string
  title: string
  description: string | null
  embedding: string | null
}

type ProfileWithEmbedding = {
  skills: unknown
  experience: unknown
  embedding: string | null
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

async function getProfileForMatching(userId: string): Promise<ProfileWithEmbedding | null> {
  const profiles = await prisma.$queryRaw<ProfileWithEmbedding[]>`
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

export async function calculateJobMatch(userId: string, jobId: string): Promise<JobMatchScore> {
  const [profile, jobs] = await Promise.all([
    getProfileForMatching(userId),
    prisma.$queryRaw<JobWithEmbedding[]>`
      SELECT
        "id",
        "title",
        "description",
        "embedding"::text AS "embedding"
      FROM "JobPosting"
      WHERE "id" = ${jobId}
      LIMIT 1
    `,
  ])

  const job = jobs[0]
  if (!profile) {
    throw new Error('User profile not found')
  }
  if (!job) {
    throw new Error('Job not found')
  }

  const cvSkills = toStringArray(profile.skills)
  const cvExperience = toExperienceString(profile.experience)
  const jobText = `${job.title} ${job.description ?? ''}`

  const profileEmbedding = parseVector(profile.embedding)
  const jobEmbedding = parseVector(job.embedding)

  let method: 'semantic' | 'keyword' = 'keyword'
  let score = keywordMatchScore(cvSkills, jobText)

  if (profileEmbedding && jobEmbedding && profileEmbedding.length === jobEmbedding.length) {
    method = 'semantic'
    score = similarityToScore(cosineSimilarity(profileEmbedding, jobEmbedding))
  }

  const explanation = explainMatch(cvSkills, cvExperience, job.title, job.description ?? '')
  explanation.score = score
  explanation.method = method

  return {
    jobId: job.id,
    score,
    explanation,
    method,
  }
}

export async function rankJobsByMatch(
  userId: string,
  options: { threshold?: number; limit?: number } = {}
): Promise<JobMatchScore[]> {
  const threshold = options.threshold ?? 0
  const limit = options.limit ?? 50
  const profile = await getProfileForMatching(userId)
  if (!profile) {
    return []
  }

  const jobs = await prisma.$queryRaw<JobWithEmbedding[]>`
    SELECT
      "id",
      "title",
      "description",
      "embedding"::text AS "embedding"
    FROM "JobPosting"
    ORDER BY "publishedAt" DESC NULLS LAST, "createdAt" DESC
    LIMIT ${limit}
  `

  const cvSkills = toStringArray(profile.skills)
  const cvExperience = toExperienceString(profile.experience)
  const profileEmbedding = parseVector(profile.embedding)

  const ranked = jobs
    .map((job) => {
      const jobText = `${job.title} ${job.description ?? ''}`
      const jobEmbedding = parseVector(job.embedding)

      let method: 'semantic' | 'keyword' = 'keyword'
      let score = keywordMatchScore(cvSkills, jobText)

      if (profileEmbedding && jobEmbedding && profileEmbedding.length === jobEmbedding.length) {
        method = 'semantic'
        score = similarityToScore(cosineSimilarity(profileEmbedding, jobEmbedding))
      }

      const explanation = explainMatch(cvSkills, cvExperience, job.title, job.description ?? '')
      explanation.score = score
      explanation.method = method

      return {
        jobId: job.id,
        score,
        explanation,
        method,
      }
    })
    .filter((item) => item.score >= threshold)
    .sort((a, b) => b.score - a.score)

  return ranked
}
