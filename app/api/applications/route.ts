import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import {
  applicationStatusValues,
  type ApplicationStatus,
  createApplicationSchema,
} from '@/lib/applications/validation'

function isApplicationStatus(value: string): value is ApplicationStatus {
  return (applicationStatusValues as readonly string[]).includes(value)
}

function parseIsoDate(value: string): Date | null {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
}

function endOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999))
}

export async function GET(request: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status')?.trim() ?? ''
  const company = searchParams.get('company')?.trim() ?? ''
  const fromParam = searchParams.get('from')?.trim() ?? ''
  const toParam = searchParams.get('to')?.trim() ?? ''

  const status = isApplicationStatus(statusParam) ? statusParam : null

  if (statusParam && !status) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const fromDate = fromParam ? parseIsoDate(fromParam) : null
  const toDate = toParam ? parseIsoDate(toParam) : null

  if (fromParam && !fromDate) {
    return NextResponse.json({ error: 'Invalid from date' }, { status: 400 })
  }

  if (toParam && !toDate) {
    return NextResponse.json({ error: 'Invalid to date' }, { status: 400 })
  }

  const appliedAtFilter =
    fromDate || toDate
      ? {
          ...(fromDate ? { gte: startOfDay(fromDate) } : {}),
          ...(toDate ? { lte: endOfDay(toDate) } : {}),
        }
      : undefined

  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: session.userId,
      ...(status ? { status } : {}),
      ...(company
        ? { company: { contains: company, mode: 'insensitive' as const } }
        : {}),
      ...(appliedAtFilter ? { appliedAt: appliedAtFilter } : {}),
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      jobPosting: {
        select: {
          id: true,
          source: true,
          url: true,
          title: true,
          company: true,
        },
      },
    },
  })

  return NextResponse.json({ applications })
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createApplicationSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    )
  }

  const data = parsed.data

  try {
    const application = await prisma.jobApplication.create({
      data: {
        userId: session.userId,
        company: data.company,
        roleTitle: data.roleTitle,
        status: data.status,
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : new Date(),
        notes: data.notes,
        offerUrl: data.offerUrl,
        source: data.source,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        salaryText: data.salaryText,
        jobPostingId: data.jobPostingId,
      },
      include: {
        jobPosting: {
          select: {
            id: true,
            source: true,
            url: true,
            title: true,
            company: true,
          },
        },
      },
    })

    return NextResponse.json({ application })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create application'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
