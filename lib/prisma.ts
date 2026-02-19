import { prisma } from '@/lib/db'
import { generateBatchEmbeddings, generateEmbedding } from '@/lib/openai/embeddings'

type JobEmbeddingRow = {
  id: string
  title: string
  description: string | null
}

function vectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`
}

export async function generateJobEmbeddings(options: { limit?: number } = {}) {
  const limit = options.limit ?? 100
  const jobs = await prisma.$queryRaw<JobEmbeddingRow[]>`
    SELECT "id", "title", "description"
    FROM "JobPosting"
    WHERE "embedding" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `

  if (jobs.length === 0) {
    return { success: true, processed: 0, remaining: 0 }
  }

  const texts = jobs.map((job) => `${job.title} ${job.description ?? ''}`.trim())
  const embeddings = await generateBatchEmbeddings(texts)

  await Promise.all(
    jobs.map((job, index) => {
      const embedding = embeddings[index]
      if (!embedding) {
        return Promise.resolve()
      }

      return prisma.$executeRaw`
        UPDATE "JobPosting"
        SET "embedding" = ${vectorLiteral(embedding)}::vector
        WHERE "id" = ${job.id}
      `
    })
  )

  const [remainingRow] = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS "count"
    FROM "JobPosting"
    WHERE "embedding" IS NULL
  `

  return {
    success: true,
    processed: jobs.length,
    remaining: Number(remainingRow?.count ?? 0),
  }
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

export async function recomputeCvEmbedding(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      skills: true,
      experience: true,
      education: true,
    },
  })

  if (!profile) {
    throw new Error('CV not found')
  }

  const text = [
    toStringArray(profile.skills).join(' '),
    toExperienceString(profile.experience),
    toStringArray(profile.education).join(' '),
  ]
    .filter(Boolean)
    .join(' ')

  if (!text.trim()) {
    throw new Error('CV has no content to embed')
  }

  const embedding = await generateEmbedding(text)

  await prisma.$executeRaw`
    UPDATE "UserProfile"
    SET "embedding" = ${vectorLiteral(embedding)}::vector
    WHERE "id" = ${profile.id}
  `

  return { success: true, cvId: profile.id }
}

export { prisma }
