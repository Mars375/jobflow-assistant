import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

import { verifySession } from '@/lib/auth/session'

function base64UrlEncode(value: Buffer | string): string {
  const buffer = typeof value === 'string' ? Buffer.from(value, 'utf8') : value
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export const runtime = 'nodejs'

function buildTelegramUrls(username: string, token: string) {
  return {
    tMeUrl: `https://t.me/${encodeURIComponent(username)}?start=${encodeURIComponent(token)}`,
    tgUrl: `tg://resolve?domain=${encodeURIComponent(username)}&start=${encodeURIComponent(token)}`,
    telegramWebUrl: 'https://web.telegram.org/',
    startCommand: `/start ${token}`,
  }
}

export async function GET(request: NextRequest) {
  const session = await verifySession()
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const username = process.env.TELEGRAM_BOT_USERNAME
  if (!username) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_USERNAME is not configured' }, { status: 500 })
  }

  const secret = process.env.TOKEN_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'TOKEN_SECRET is not configured' }, { status: 500 })
  }

  const payload = {
    userId: session.userId,
    exp: Date.now() + 15 * 60 * 1000,
    n: crypto.randomBytes(8).toString('hex'),
  }

  const payloadPart = base64UrlEncode(JSON.stringify(payload))
  const signature = crypto.createHmac('sha256', secret).update(payloadPart).digest()
  const signaturePart = base64UrlEncode(signature)
  const token = `${payloadPart}.${signaturePart}`
  const urls = buildTelegramUrls(username, token)

  if (request.nextUrl.searchParams.get('mode') === 'urls') {
    return NextResponse.json(urls)
  }

  return NextResponse.redirect(urls.tMeUrl)
}
