# JobFlow Assistant

France-focused job discovery + application tracking, with daily digests and real-time alerts.

## What You Get

- Job feed aggregation (France Travail + optional Adzuna)
- CV/profile matching (keyword + embeddings when available)
- Application tracker (Kanban + table)
- Alerts:
  - Daily email digest (top matches)
  - Real-time Slack alerts (Incoming Webhook)
  - Real-time Telegram alerts (single app bot + connect flow)

## Tech Stack

- Next.js (App Router)
- Prisma + Postgres (Neon)
- Tailwind CSS
- Resend for emails
- Slack Incoming Webhooks
- Telegram Bot API (webhook)

## Local Development

1) Install dependencies

```bash
npm install
```

2) Configure environment

```bash
cp .env.example .env
```

Fill at minimum:
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL` (usually `http://localhost:3000`)
- `TOKEN_SECRET`

3) Sync database schema

```bash
npm run db:push
```

4) Start dev server

```bash
npm run dev
```

## Environment Variables

See `.env.example` for the full list.

Key variables:
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `CRON_SECRET` (protects internal cron endpoints)

Telegram:
- `TELEGRAM_BOT_TOKEN` (server-side only)
- `TELEGRAM_BOT_USERNAME` (without `@`)
- `TELEGRAM_WEBHOOK_SECRET` (Telegram secret_token header)

## Cron Endpoints

These endpoints are protected by `CRON_SECRET` using `Authorization: Bearer <CRON_SECRET>`.

- `POST /api/alerts/digest`
  - Sends daily digest to eligible users.
- `POST /api/alerts/trigger`
  - Triggers realtime alerts for a batch of `{ userId, jobId, score }`.

Example:

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/alerts/digest" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Telegram Connect Flow (Recommended)

The app uses a single Telegram bot token on the server. Users do NOT paste tokens.

Flow:
- User clicks "Connecter Telegram" in `/account/notifications`
- They are redirected to `https://t.me/<bot>?start=<signed_token>`
- They click Start
- Telegram webhook binds `chat_id` to the user

Endpoints:
- `GET /api/integrations/telegram/connect` (signed redirect)
- `POST /api/integrations/telegram/webhook` (Telegram webhook)

To set Telegram webhook:

```bash
curl -sS "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=$NEXT_PUBLIC_APP_URL/api/integrations/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

## Deployment (Vercel)

Recommended setup:

1) Deploy from a branch containing only the app (no extra directories)
2) Set env vars in Vercel Project Settings
3) Configure Telegram `setWebhook` to your production URL

## Security Notes

- Never commit `.env`
- Telegram bot token stays server-side only
- Slack webhooks are validated to avoid SSRF

---

If you want: add a CONTRIBUTING.md and a one-command bootstrap script for local setup.
