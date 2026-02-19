import 'server-only'

import { prisma } from '@/lib/db'
import { ALERT_RATE_LIMITS } from '@/lib/alerts/schema'
import { sendSlackAlert } from '@/lib/alerts/slack'
import { sendTelegramAlert } from '@/lib/alerts/telegram'
import type { AlertType } from '@prisma/client'

type AlertCheck = {
  shouldAlert: boolean
  reason?: string
}

function minutesBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60)
}

export async function shouldAlertUser(userId: string, score: number): Promise<AlertCheck> {
  if (score < ALERT_RATE_LIMITS.BATCHED_SCORE_THRESHOLD) {
    return { shouldAlert: false, reason: 'Score below threshold' }
  }

  const notification =
    (await prisma.userNotification.findUnique({ where: { userId } })) ??
    (await prisma.userNotification.create({ data: { userId } }))

  const hasSlack = Boolean(notification.slackWebhookUrl)
  const hasTelegram = Boolean(process.env.TELEGRAM_BOT_TOKEN && notification.telegramChatId)
  if (!hasSlack && !hasTelegram) {
    return { shouldAlert: false, reason: 'No Slack/Telegram configured' }
  }

  if (notification.lastAlertSentAt) {
    const minutesSince = minutesBetween(new Date(), notification.lastAlertSentAt)
    if (minutesSince < ALERT_RATE_LIMITS.COOLDOWN_MINUTES) {
      return { shouldAlert: false, reason: 'Cooldown active' }
    }
  }

  const now = new Date()
  const resetAgeHours = (now.getTime() - notification.dailyAlertsResetAt.getTime()) / (1000 * 60 * 60)
  if (resetAgeHours >= 24) {
    await prisma.userNotification.update({
      where: { userId },
      data: {
        dailyAlertsCount: 0,
        dailyAlertsResetAt: now,
      },
    })
  }

  if (notification.dailyAlertsCount >= ALERT_RATE_LIMITS.DAILY_CAP) {
    return { shouldAlert: false, reason: 'Daily cap reached' }
  }

  return { shouldAlert: true }
}

export async function wasJobAlerted(userId: string, jobId: string, alertType: AlertType): Promise<boolean> {
  const existing = await prisma.sentAlert.findUnique({
    where: {
      userId_jobId_alertType: {
        userId,
        jobId,
        alertType,
      },
    },
  })

  return Boolean(existing)
}

export async function triggerRealtimeAlert(userId: string, jobId: string, score: number) {
  const check = await shouldAlertUser(userId, score)
  if (!check.shouldAlert) {
    return { skipped: true, reason: check.reason }
  }

  const [user, job] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { notifications: true } }),
    prisma.jobPosting.findUnique({ where: { id: jobId } }),
  ])

  if (!user || !user.notifications || !job) {
    return { skipped: true, reason: 'User or job not found' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobflow-assistant.com'
  const jobUrl = `${appUrl.replace(/\/$/, '')}/jobs/${job.id}`
  const isImmediate = score >= ALERT_RATE_LIMITS.IMMEDIATE_SCORE_THRESHOLD

  const payload = {
    jobTitle: job.title,
    company: job.company ?? 'Entreprise non renseignee',
    location: job.location ?? 'Localisation non renseignee',
    salaryText: job.salaryText,
    matchScore: score,
    jobUrl,
  }

  const results: Record<string, unknown> = {}
  const sentTypes: AlertType[] = []

  if (user.notifications.slackWebhookUrl) {
    const alertType: AlertType = 'SLACK_REALTIME'
    const already = await wasJobAlerted(userId, jobId, alertType)
    if (!already) {
      await sendSlackAlert(user.notifications.slackWebhookUrl, payload, isImmediate)
      sentTypes.push(alertType)
      results.slack = { sent: true }
    } else {
      results.slack = { skipped: true, reason: 'Already alerted' }
    }
  }

  if (process.env.TELEGRAM_BOT_TOKEN && user.notifications.telegramChatId) {
    const alertType: AlertType = 'TELEGRAM_REALTIME'
    const already = await wasJobAlerted(userId, jobId, alertType)
    if (!already) {
      await sendTelegramAlert(
        user.notifications.telegramChatId,
        payload,
        isImmediate
      )
      sentTypes.push(alertType)
      results.telegram = { sent: true }
    } else {
      results.telegram = { skipped: true, reason: 'Already alerted' }
    }
  }

  if (sentTypes.length === 0) {
    return { skipped: true, reason: 'No channel sent', details: results }
  }

  await prisma.sentAlert.createMany({
    data: sentTypes.map((alertType) => ({
      userId,
      jobId,
      alertType,
    })),
    skipDuplicates: true,
  })

  await prisma.userNotification.update({
    where: { userId },
    data: {
      lastAlertSentAt: new Date(),
      dailyAlertsCount: { increment: 1 },
    },
  })

  return { sent: true, immediate: isImmediate, types: sentTypes, details: results }
}
