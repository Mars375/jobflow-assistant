# JobFlow Assistant

> France-focused job discovery and application tracking — with daily digests, real-time Slack and Telegram alerts.

Aggregates job listings from France Travail and Adzuna, matches them against your CV using keyword scoring, and tracks your applications in a Kanban + table view. Sends daily email digests and fires real-time alerts to Slack or Telegram when strong matches appear.

## Features

- **Job feed** — aggregates listings from France Travail + optional Adzuna
- **CV matching** — keyword scoring (+ embeddings when available)
- **Application tracker** — Kanban board + table view
- **Daily digest** — email summary of top matches via Resend
- **Real-time alerts** — Slack Incoming Webhook + Telegram bot
- **Telegram connect flow** — users link their account without exposing a token

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js (App Router) |
| Database | Neon Postgres + Prisma |
| Email | Resend |
| Notifications | Slack Incoming Webhooks, Telegram Bot API |
| UI | Tailwind CSS |
| Deploy | Vercel |

## Getting Started

```bash
git clone https://github.com/your-username/jobflow-assistant.git
cd jobflow-assistant
npm install
cp .env.example .env
```

Fill in `.env` — at minimum:

```env
DATABASE_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
TOKEN_SECRET=

# Email
RESEND_API_KEY=

# Cron endpoint protection
CRON_SECRET=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=     # without @
TELEGRAM_WEBHOOK_SECRET=
```

Sync the schema and start dev:

```bash
npm run db:push
npm run dev
```

## Cron Endpoints

Both endpoints require `Authorization: Bearer <CRON_SECRET>`.

```bash
# Daily digest — top job matches for all users
curl -X POST "$NEXT_PUBLIC_APP_URL/api/alerts/digest" \
  -H "Authorization: Bearer $CRON_SECRET"

# Real-time alerts — trigger for a batch of matches
curl -X POST "$NEXT_PUBLIC_APP_URL/api/alerts/trigger" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '[{"userId": "...", "jobId": "...", "score": 0.91}]'
```

Configure these in `vercel.json` using `crons` to run automatically on a schedule.

## Telegram Connect Flow

The app uses a single bot token server-side — users never paste tokens.

1. User clicks **Connecter Telegram** in `/account/notifications`
2. They're redirected to `https://t.me/<bot>?start=<signed_token>`
3. They click Start in Telegram
4. The webhook binds their `chat_id` to their account

Set the Telegram webhook once after deploying:

```bash
curl -sS "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=$NEXT_PUBLIC_APP_URL/api/integrations/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

## Deploy

1. Deploy to Vercel from the repo
2. Add all env vars in **Project → Settings → Environment Variables**
3. Run the Telegram `setWebhook` command above with your production URL
4. Configure cron jobs in `vercel.json`

## Security

- Never commit `.env` — add it to `.gitignore`
- `TELEGRAM_BOT_TOKEN` is server-side only
- Slack webhooks are validated before use
- Cron endpoints are protected by `CRON_SECRET`
