import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { verifySession } from '@/lib/auth/session'
import { AppHeader } from '@/components/layout/app-header'

type ConnectUrls = {
  tMeUrl: string
  tgUrl: string
  telegramWebUrl: string
  startCommand: string
}

async function loadConnectUrls(): Promise<ConnectUrls> {
  const headerStore = await headers()
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http'

  if (!host) {
    throw new Error('Missing host header')
  }

  const res = await fetch(`${protocol}://${host}/api/integrations/telegram/connect?mode=urls`, {
    cache: 'no-store',
    headers: {
      cookie: headerStore.get('cookie') ?? '',
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || 'Impossible de preparer la connexion Telegram')
  }

  return await res.json()
}

export default async function TelegramConnectPage() {
  const session = await verifySession()
  if (!session) {
    redirect('/login')
  }

  let urls: ConnectUrls | null = null
  let errorMessage = ''

  try {
    urls = await loadConnectUrls()
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
  }

  return (
    <main className="app-shell">
      <AppHeader />

      <div className="app-page max-w-2xl">
        <h1 className="app-title">Connecter Telegram</h1>
        <p className="app-subtitle">
          Si Telegram n&apos;est pas installe localement, utilisez les options navigateur ci-dessous.
        </p>

        <section className="panel panel-pad mt-8 space-y-5">
          {errorMessage ? (
            <p className="text-sm font-semibold text-rose-700">{errorMessage}</p>
          ) : null}

          {urls ? (
            <>
              <div className="flex flex-wrap gap-2">
                <a className="btn-primary" href={urls.tgUrl}>
                  Ouvrir dans Telegram (app)
                </a>
                <a className="btn-ghost" href={urls.tMeUrl} target="_blank" rel="noreferrer noopener">
                  Ouvrir dans le navigateur
                </a>
                <a
                  className="btn-ghost"
                  href={urls.telegramWebUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Ouvrir Telegram Web
                </a>
              </div>

              <div className="rounded-xl border border-app-border bg-app-panel/60 p-4">
                <p className="text-sm font-semibold text-app-ink">Commande de secours</p>
                <p className="mt-1 text-xs text-app-muted">
                  Si Telegram Web ne reprend pas automatiquement le token, copiez cette commande et envoyez-la
                  au bot.
                </p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-app-bg p-3 text-xs text-app-ink">
                  {urls.startCommand}
                </pre>
              </div>

              <p className="text-xs text-app-muted">
                Une fois que vous avez clique Start dans Telegram, revenez dans Notifications puis utilisez
                &quot;Verifier la connexion&quot; pour rafraichir le statut.
              </p>
            </>
          ) : null}

          <div>
            <Link className="btn-ghost" href="/account/notifications">
              Retour aux notifications
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
