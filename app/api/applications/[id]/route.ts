import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { updateApplicationSchema } from '@/lib/applications/validation'

type Params = {
  params: Promise<{ id: string }>
}

const RESPONSE_STATUSES = new Set<string>(['ENTRETIEN', 'OFFRE', 'REFUSE'])

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = updateApplicationSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
      { status: 400 }
    )
  }

  const existing = await prisma.jobApplication.findFirst({
    where: { id, userId: session.userId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const data = parsed.data

  const updateData: Record<string, unknown> = {
    ...(typeof data.company === 'string' ? { company: data.company } : {}),
    ...(typeof data.roleTitle === 'string' ? { roleTitle: data.roleTitle } : {}),
    ...(typeof data.notes === 'string' ? { notes: data.notes } : {}),
    ...(typeof data.offerUrl === 'string' ? { offerUrl: data.offerUrl } : {}),
    ...(typeof data.source === 'string' ? { source: data.source } : {}),
    ...(typeof data.contactName === 'string' ? { contactName: data.contactName } : {}),
    ...(typeof data.contactEmail === 'string' ? { contactEmail: data.contactEmail } : {}),
    ...(typeof data.contactPhone === 'string' ? { contactPhone: data.contactPhone } : {}),
    ...(typeof data.salaryText === 'string' ? { salaryText: data.salaryText } : {}),
    ...(typeof data.appliedAt === 'string' ? { appliedAt: new Date(data.appliedAt) } : {}),
  }

  if (data.jobPostingId === null) {
    updateData.jobPostingId = null
  } else if (typeof data.jobPostingId === 'string') {
    updateData.jobPostingId = data.jobPostingId
  }

  if (data.status && data.status !== existing.status) {
    updateData.status = data.status

    if (
      existing.firstResponseAt == null &&
      existing.status === 'EN_ATTENTE' &&
      RESPONSE_STATUSES.has(data.status)
    ) {
      updateData.firstResponseAt = new Date()
    }
  }

  try {
    const application = await prisma.jobApplication.update({
      where: { id: existing.id },
      data: updateData,
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
    const message = error instanceof Error ? error.message : 'Failed to update application'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
