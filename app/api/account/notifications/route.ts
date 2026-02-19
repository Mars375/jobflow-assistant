import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { verifySession } from '@/lib/auth/session'
import { sendSlackAlert } from '@/lib/alerts/slack'
import { sendTelegramAlert } from '@/lib/alerts/telegram'

function normalizeOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date())
    return true
  } catch {
    return false
  }
}

function validateSlackWebhookUrl(value: string): string | null {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return 'Slack webhook must be https'
    if (url.hostname !== 'hooks.slack.com') return 'Slack webhook host must be hooks.slack.com'
    return null
  } catch {
    return 'Invalid Slack webhook URL'
  }
}

export async function GET(_request: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const notification = await prisma.userNotification.findUnique({
    where: { userId: session.userId },
  })

  if (!notification) {
    return NextResponse.json({
      emailDigestEnabled: true,
      timezone: 'Europe/Paris',
      slackWebhookUrl: null,
      telegramChatId: null,
      telegramConnected: false,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  }

  return NextResponse.json({
    emailDigestEnabled: notification.emailDigestEnabled,
    timezone: notification.timezone,
    slackWebhookUrl: notification.slackWebhookUrl,
    telegramChatId: notification.telegramChatId,
    telegramConnected: Boolean(notification.telegramChatId),
  }, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))

  const emailDigestEnabled =
    typeof (body as { emailDigestEnabled?: unknown }).emailDigestEnabled === 'boolean'
      ? (body as { emailDigestEnabled: boolean }).emailDigestEnabled
      : undefined

  const timezoneRaw = (body as { timezone?: unknown }).timezone
  const timezone = typeof timezoneRaw === 'string' ? timezoneRaw.trim() : undefined
  if (timezone !== undefined && timezone !== '' && !isValidTimezone(timezone)) {
    return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 })
  }

  const slackWebhookUrl = normalizeOptionalString((body as { slackWebhookUrl?: unknown }).slackWebhookUrl)
  const telegramChatId = normalizeOptionalString((body as { telegramChatId?: unknown }).telegramChatId)

  if (typeof slackWebhookUrl === 'string') {
    const slackError = validateSlackWebhookUrl(slackWebhookUrl)
    if (slackError) {
      return NextResponse.json({ error: slackError }, { status: 400 })
    }
  }

  const notification = await prisma.userNotification.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      emailDigestEnabled: emailDigestEnabled ?? true,
      timezone: timezone && timezone !== '' ? timezone : 'Europe/Paris',
      slackWebhookUrl: slackWebhookUrl ?? null,
      telegramChatId: telegramChatId ?? null,
    },
    update: {
      ...(emailDigestEnabled !== undefined ? { emailDigestEnabled } : {}),
      ...(timezone !== undefined && timezone !== '' ? { timezone } : {}),
      ...(slackWebhookUrl !== undefined ? { slackWebhookUrl } : {}),
      ...(telegramChatId !== undefined ? { telegramChatId } : {}),
    },
  })

  return NextResponse.json({
    success: true,
    notification: {
      emailDigestEnabled: notification.emailDigestEnabled,
      timezone: notification.timezone,
      slackWebhookUrl: notification.slackWebhookUrl,
      telegramChatId: notification.telegramChatId,
    },
  })
}

export async function PUT(request: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const type = (body as { type?: unknown }).type
  if (type !== 'slack' && type !== 'telegram') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const notification = await prisma.userNotification.findUnique({
    where: { userId: session.userId },
  })

  if (!notification) {
    return NextResponse.json({ error: 'No notification settings' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobflow-assistant.com'
  const payload = {
    jobTitle: 'Test Job',
    company: 'JobFlow Assistant',
    location: 'Paris, France',
    salaryText: null,
    matchScore: 95,
    jobUrl: `${appUrl.replace(/\/$/, '')}/jobs`,
  }

  try {
    if (type === 'slack') {
      if (!notification.slackWebhookUrl) {
        return NextResponse.json({ error: 'Slack webhook not configured' }, { status: 400 })
      }
      await sendSlackAlert(notification.slackWebhookUrl, payload, true)
    }

    if (type === 'telegram') {
      if (!process.env.TELEGRAM_BOT_TOKEN || !notification.telegramChatId) {
        return NextResponse.json({ error: 'Telegram not configured' }, { status: 400 })
      }
      await sendTelegramAlert(notification.telegramChatId, payload, true)
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, message: 'Test alert sent' })
}
