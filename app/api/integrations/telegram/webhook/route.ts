import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4
  const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding)
  return Buffer.from(padded, 'base64')
}

function parseStartToken(text: string): string | null {
  const match = text.match(/^\/start(?:@\w+)?\s+(\S+)/)
  return match?.[1] ?? null
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET ?? process.env.TOKEN_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'TELEGRAM_WEBHOOK_SECRET is not configured' }, { status: 500 })
  }

  const secretHeader = request.headers.get('x-telegram-bot-api-secret-token')
  if (secretHeader !== webhookSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const update = await request.json().catch(() => null)
  const message = update?.message
  const text = typeof message?.text === 'string' ? message.text : ''
  const chatId = message?.chat?.id

  if (!text || typeof chatId !== 'number') {
    return NextResponse.json({ ok: true })
  }

  const token = parseStartToken(text)
  if (!token) {
    return NextResponse.json({ ok: true })
  }

  const tokenSecret = process.env.TOKEN_SECRET
  if (!tokenSecret) {
    return NextResponse.json({ error: 'TOKEN_SECRET is not configured' }, { status: 500 })
  }

  const [payloadPart, signaturePart, ...rest] = token.split('.')
  if (!payloadPart || !signaturePart || rest.length > 0) {
    return NextResponse.json({ ok: true })
  }

  let providedSig: Buffer
  try {
    providedSig = base64UrlDecode(signaturePart)
  } catch {
    return NextResponse.json({ ok: true })
  }

  const expectedSig = crypto.createHmac('sha256', tokenSecret).update(payloadPart).digest()
  if (providedSig.length !== expectedSig.length || !crypto.timingSafeEqual(providedSig, expectedSig)) {
    return NextResponse.json({ ok: true })
  }

  let payload: { userId?: unknown; exp?: unknown }
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart).toString('utf8')) as { userId?: unknown; exp?: unknown }
  } catch {
    return NextResponse.json({ ok: true })
  }

  const userId = typeof payload.userId === 'string' ? payload.userId : null
  const exp = typeof payload.exp === 'number' ? payload.exp : null

  if (!userId || !exp || Date.now() > exp) {
    return NextResponse.json({ ok: true })
  }

  await prisma.userNotification.upsert({
    where: { userId },
    create: { userId, telegramChatId: String(chatId) },
    update: { telegramChatId: String(chatId) },
  })

  return NextResponse.json({ ok: true })
}
