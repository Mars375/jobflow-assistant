import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { generateBatchEmbeddings } from '@/lib/openai/embeddings'

export const runtime = 'nodejs'

type JobRow = {
  id: string
  title: string
  description: string | null
}

function isAuthorized(request: NextRequest, hasSession: boolean): boolean {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (secret && token && token === secret) {
    return true
  }
  return hasSession
}

function vectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!isAuthorized(request, Boolean(session))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const jobs = await prisma.$queryRaw<JobRow[]>`
      SELECT "id", "title", "description"
      FROM "JobPosting"
      WHERE "embedding" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT 100
    `

    if (jobs.length === 0) {
      return NextResponse.json({ success: true, processed: 0 })
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

    return NextResponse.json({
      success: true,
      processed: jobs.length,
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
