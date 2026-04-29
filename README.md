# JobFlow Assistant

A France-focused job search assistant that combines job aggregation, CV-based matching, application tracking, and multi-channel alerts.

JobFlow Assistant pulls job listings from France Travail and Adzuna, matches them against a user's profile and CV, tracks applications, and sends notifications by email, Slack, and Telegram. The current repo also includes account security flows, GDPR export/deletion tooling, smoke tests, and embedding-based matching support.

## Features

- Job aggregation from France Travail and optional Adzuna fallback
- CV upload and parsing with profile data storage
- Job matching using keyword scoring, with semantic matching when embeddings are available
- Application tracking with board and table-style UI
- Application export to CSV
- Daily email digests via Resend
- Real-time alerts via Slack webhook and Telegram
- Telegram account linking through a signed connect flow
- Unread job tracking and sync endpoints
- Account management including password changes and notification settings
- GDPR tooling for export and hard deletion
- Tests for auth and matching logic, plus a smoke-test script for deployed/runtime checks

## Tech Stack

- **Framework:** Next.js 16, React 19, TypeScript
- **Database:** Neon Postgres + Prisma
- **Auth/session layer:** custom session + token flow with `jose` and `bcryptjs`
- **Queue / rate limiting:** Upstash Redis
- **Email:** Resend + React Email
- **AI / embeddings:** OpenAI
- **Vector support:** pgvector
- **Job sources:** France Travail API, Adzuna API
- **UI:** Tailwind CSS v4
- **Testing:** Vitest

## Local Setup

```bash
git clone https://github.com/Mars375/jobflow-assistant.git
cd jobflow-assistant
npm install
cp .env.example .env
```

Fill in the variables from `.env.example`:

```env
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
TOKEN_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
RESEND_API_KEY=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
EMAIL_FROM="JobFlow Assistant <onboarding@resend.dev>"
FRANCE_TRAVAIL_CLIENT_ID=
FRANCE_TRAVAIL_CLIENT_SECRET=
FRANCE_TRAVAIL_SCOPE="api_offresdemploiv2 o2dsoffre"
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
```

Set up the database and start the app:

```bash
npm run db:push
npm run dev
```

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:push
npm run db:generate
npm run test
npm run test:watch
npm run test:coverage
npm run test:smoke
```

## Deployment Notes

The repo contains routes for daily digests, real-time alerts, Telegram webhooks, and job sync / embedding workflows. Those flows require the relevant environment variables to be configured before they work in a deployed environment.

## Project Status

**Current status: substantial application prototype.**

The repository already goes beyond a simple demo: it includes auth, jobs sync, matching, notifications, application tracking, GDPR export/deletion, and smoke tests. It still relies on multiple external services and credentials, and some advanced behavior—especially embeddings and integrations—only becomes active when those services are configured.
