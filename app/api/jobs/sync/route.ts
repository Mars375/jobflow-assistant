import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { fetchFranceTravailJobs } from '@/lib/jobs/france-travail-api'
import { fetchAdzunaJobs } from '@/lib/jobs/adzuna-api'
import { verifySession } from '@/lib/auth/session'
import { generateJobEmbeddings } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function isAuthorized(request: NextRequest, hasSession: boolean): boolean {
  const secret = process.env.JOBS_SYNC_SECRET
  const header = request.headers.get('x-sync-secret')
  if (secret && header && header === secret) return true
  return hasSession
}

export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!isAuthorized(request, Boolean(session))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Sync] Starting jobs fetch...')
    const [franceTravail, adzuna] = await Promise.all([
      fetchFranceTravailJobs(),
      fetchAdzunaJobs(),
    ])

    const jobs = [...franceTravail.jobs, ...adzuna.jobs]
    const malformedCount = franceTravail.malformedCount + adzuna.malformedCount

    let sourceUsed = 'none'
    if (franceTravail.jobs.length > 0 && adzuna.jobs.length > 0) {
      sourceUsed = 'france-travail-api+adzuna-api'
    } else if (franceTravail.jobs.length > 0) {
      sourceUsed = 'france-travail-api'
    } else if (adzuna.jobs.length > 0) {
      sourceUsed = 'adzuna-api'
    }

    console.log(`[Sync] Source ${sourceUsed}: ${jobs.length} jobs, ${malformedCount} malformed`)

    let created = 0
    let updated = 0

    for (const job of jobs) {
      try {
        const existing = await prisma.jobPosting.findUnique({
          where: {
            source_sourceId: {
              source: job.source,
              sourceId: job.sourceId,
            },
          },
          select: { id: true },
        })

        await prisma.jobPosting.upsert({
          where: {
            source_sourceId: {
              source: job.source,
              sourceId: job.sourceId,
            },
          },
          update: {
            title: job.title,
            company: job.company,
            location: job.location,
            contractType: job.contractType,
            description: job.description,
            salaryText: job.salaryText,
            publishedAt: job.publishedAt,
            fetchedAt: job.fetchedAt,
            url: job.url,
            metadata: job.metadata as Prisma.InputJsonValue,
          },
          create: {
            source: job.source,
            sourceId: job.sourceId,
            title: job.title,
            company: job.company,
            location: job.location,
            contractType: job.contractType,
            description: job.description,
            salaryText: job.salaryText,
            publishedAt: job.publishedAt,
            fetchedAt: job.fetchedAt,
            url: job.url,
            metadata: job.metadata as Prisma.InputJsonValue,
          },
        })

        if (existing) {
          updated += 1
        } else {
          created += 1
        }
      } catch (jobError) {
        console.error(`[Sync] Error processing job ${job.sourceId}:`, jobError)
      }
    }

    let embeddingResult = { success: true, processed: 0, remaining: 0 }
    if (created > 0) {
      embeddingResult = await generateJobEmbeddings({ limit: Math.max(created, 50) })
      console.log(
        `[Sync] Embeddings generated: ${embeddingResult.processed}, remaining: ${embeddingResult.remaining}`
      )
    }

    console.log(`[Sync] Complete: ${created} created, ${updated} updated`)
    return NextResponse.json({
      source: sourceUsed,
      fetched: jobs.length,
      created,
      updated,
      skipped: malformedCount,
      embeddingsProcessed: embeddingResult.processed,
      embeddingsRemaining: embeddingResult.remaining,
    })
  } catch (error) {
    console.error('[Sync] Error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
