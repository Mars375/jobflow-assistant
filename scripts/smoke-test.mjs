#!/usr/bin/env node

const baseUrl = (process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
const cronSecret = process.env.CRON_SECRET || ''
const telegramWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.TOKEN_SECRET || ''
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || ''
const failOnWebhookMismatch = process.env.SMOKE_STRICT_WEBHOOK === '1'

const checks = []

function addCheck(name, run) {
  checks.push({ name, run })
}

async function runCheck(check) {
  try {
    const result = await check.run()
    if (!result.pass) {
      return { name: check.name, pass: false, detail: result.detail }
    }
    return { name: check.name, pass: true, detail: result.detail }
  } catch (error) {
    return {
      name: check.name,
      pass: false,
      detail: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function statusOk(actual, expected) {
  return expected.includes(actual)
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`
  const res = await fetch(url, {
    redirect: 'manual',
    ...options,
  })
  return res
}

addCheck('Homepage responds', async () => {
  const res = await request('/')
  const pass = statusOk(res.status, [200, 307, 308])
  return { pass, detail: `GET / => ${res.status}` }
})

addCheck('Login page responds', async () => {
  const res = await request('/login')
  const pass = statusOk(res.status, [200])
  return { pass, detail: `GET /login => ${res.status}` }
})

addCheck('Register page responds', async () => {
  const res = await request('/register')
  const pass = statusOk(res.status, [200])
  return { pass, detail: `GET /register => ${res.status}` }
})

addCheck('Protected notification API rejects anonymous', async () => {
  const res = await request('/api/account/notifications')
  const pass = statusOk(res.status, [401])
  return { pass, detail: `GET /api/account/notifications => ${res.status}` }
})

addCheck('Digest cron endpoint rejects missing auth', async () => {
  const res = await request('/api/alerts/digest', { method: 'POST' })
  const pass = statusOk(res.status, [401])
  return { pass, detail: `POST /api/alerts/digest (no token) => ${res.status}` }
})

addCheck('Realtime trigger rejects missing auth', async () => {
  const res = await request('/api/alerts/trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobs: [] }),
  })
  const pass = statusOk(res.status, [401])
  return { pass, detail: `POST /api/alerts/trigger (no token) => ${res.status}` }
})

addCheck('Telegram connect route redirects anonymous user to login', async () => {
  const res = await request('/api/integrations/telegram/connect?mode=urls')
  const pass = statusOk(res.status, [302, 307, 308])
  return { pass, detail: `GET /api/integrations/telegram/connect?mode=urls => ${res.status}` }
})

addCheck('Telegram webhook rejects bad secret', async () => {
  const res = await request('/api/integrations/telegram/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-bot-api-secret-token': 'invalid-smoke-secret',
    },
    body: JSON.stringify({ message: { text: '/start smoke', chat: { id: 1 } } }),
  })
  const pass = statusOk(res.status, [401])
  return { pass, detail: `POST /api/integrations/telegram/webhook (bad secret) => ${res.status}` }
})

if (cronSecret) {
  addCheck('Realtime trigger accepts cron auth with empty job batch', async () => {
    const res = await request('/api/alerts/trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({ jobs: [] }),
    })
    const pass = statusOk(res.status, [200])
    return { pass, detail: `POST /api/alerts/trigger (auth, empty jobs) => ${res.status}` }
  })
}

if (telegramWebhookSecret) {
  addCheck('Telegram webhook accepts valid secret and benign payload', async () => {
    const res = await request('/api/integrations/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': telegramWebhookSecret,
      },
      body: JSON.stringify({ message: { text: 'hello smoke', chat: { id: 1 } } }),
    })
    const pass = statusOk(res.status, [200])
    let body = null
    try {
      body = await res.json()
    } catch {
      body = null
    }
    const bodyOk = body && typeof body === 'object' && body.ok === true
    return {
      pass: pass && bodyOk,
      detail: `POST /api/integrations/telegram/webhook (valid secret) => ${res.status}, body.ok=${String(bodyOk)}`,
    }
  })
}

if (telegramBotToken) {
  addCheck('Telegram bot token is valid (getMe)', async () => {
    const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getMe`)
    const body = await res.json().catch(() => null)
    const pass = Boolean(body && body.ok)
    return { pass, detail: `Telegram getMe ok=${String(body?.ok === true)}` }
  })

  addCheck('Telegram webhook points to this deployment', async () => {
    const res = await fetch(`https://api.telegram.org/bot${telegramBotToken}/getWebhookInfo`)
    const body = await res.json().catch(() => null)
    const webhookUrl = body?.result?.url || ''
    const expected = `${baseUrl}/api/integrations/telegram/webhook`
    const pass = webhookUrl === expected
    if (!pass && failOnWebhookMismatch) {
      return { pass: false, detail: `Webhook mismatch: actual=${webhookUrl || '(empty)'} expected=${expected}` }
    }
    return {
      pass: true,
      detail: pass
        ? `Webhook URL matches: ${expected}`
        : `Warning only: webhook URL mismatch actual=${webhookUrl || '(empty)'} expected=${expected}`,
    }
  })
}

console.log(`Running smoke tests against ${baseUrl}`)
console.log('')

const results = []
for (const check of checks) {
  const result = await runCheck(check)
  results.push(result)
  const icon = result.pass ? '[PASS]' : '[FAIL]'
  console.log(`${icon} ${result.name} - ${result.detail}`)
}

const failed = results.filter((x) => !x.pass)
console.log('')
console.log(`Smoke summary: ${results.length - failed.length}/${results.length} passed`)

if (failed.length > 0) {
  process.exitCode = 1
}
