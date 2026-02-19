'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { detectTimezone } from '@/lib/alerts/timezone'

type NotificationSettings = {
  emailDigestEnabled: boolean
  timezone: string
  slackWebhookUrl: string | null
  telegramChatId: string | null
}

const defaultSettings: NotificationSettings = {
  emailDigestEnabled: true,
  timezone: 'Europe/Paris',
  slackWebhookUrl: null,
  telegramChatId: null,
}

export function NotificationSettings() {
  const detectedTimezone = useMemo(() => detectTimezone(), [])
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<'slack' | 'telegram' | null>(null)
  const [checkingTelegram, setCheckingTelegram] = useState(false)
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const isMountedRef = useRef(true)

  const loadSettings = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false

    if (!silent) {
      setLoading(true)
    }
    setError('')

    try {
      const res = await fetch('/api/account/notifications', { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Failed to load settings')
      }

      const data = await res.json()
      const nextSettings: NotificationSettings = {
        emailDigestEnabled: Boolean(data?.emailDigestEnabled ?? true),
        timezone: String(data?.timezone ?? 'Europe/Paris'),
        slackWebhookUrl: data?.slackWebhookUrl ?? null,
        telegramChatId: data?.telegramChatId ?? null,
      }

      if (isMountedRef.current) {
        setSettings(nextSettings)
      }

      return nextSettings
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      }
      return null
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }

    return null
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    void loadSettings()

    return () => {
      isMountedRef.current = false
    }
  }, [loadSettings])

  async function handleSave() {
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/account/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || 'Failed to save settings')
      }

      setMessage('Parametres enregistres')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest(type: 'slack' | 'telegram') {
    setTesting(type)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/account/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || 'Failed to send test alert')
      }

      setMessage(`Test envoye (${type})`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send test alert')
    } finally {
      setTesting(null)
    }
  }

  async function handleDisconnectTelegram() {
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/account/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramChatId: null }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error || 'Failed to disconnect Telegram')
      }

      setSettings((prev) => ({ ...prev, telegramChatId: null }))
      setMessage('Telegram deconnecte')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect Telegram')
    } finally {
      setSaving(false)
    }
  }

  async function handleRefreshTelegramStatus() {
    setCheckingTelegram(true)
    setMessage('')
    setError('')

    try {
      const latest = await loadSettings({ silent: true })
      if (latest?.telegramChatId) {
        setMessage('Telegram connecte')
      } else {
        setMessage('Connexion Telegram en attente')
      }
    } finally {
      setCheckingTelegram(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-app-muted">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <section className="panel panel-pad">
        <h2 className="font-serif text-lg font-semibold tracking-tight">Digeste email quotidien</h2>
        <div className="mt-4 space-y-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.emailDigestEnabled}
              onChange={(e) => setSettings({ ...settings, emailDigestEnabled: e.target.checked })}
            />
            <span>Activer le digeste quotidien (8h, votre fuseau horaire)</span>
          </label>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium">
              Fuseau horaire
            </label>
            <input
              id="timezone"
              type="text"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              placeholder="Europe/Paris"
              className="input mt-1"
            />
            <p className="mt-2 text-xs text-app-muted">Detecte automatiquement: {detectedTimezone}</p>
          </div>
        </div>
      </section>

      <section className="panel panel-pad">
        <h2 className="font-serif text-lg font-semibold tracking-tight">Alertes Slack</h2>
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <label htmlFor="slackWebhookUrl" className="block text-sm font-medium">
              Webhook URL
            </label>
            <input
              id="slackWebhookUrl"
              type="url"
              value={settings.slackWebhookUrl ?? ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  slackWebhookUrl: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="https://hooks.slack.com/services/..."
              className="input mt-1"
            />
          </div>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => handleTest('slack')}
            disabled={!settings.slackWebhookUrl || testing === 'slack'}
          >
            {testing === 'slack' ? 'Envoi en cours...' : 'Envoyer un test'}
          </button>
        </div>
      </section>

      <section className="panel panel-pad">
        <h2 className="font-serif text-lg font-semibold tracking-tight">Alertes Telegram</h2>
        <div className="mt-4 space-y-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-app-border bg-app-panel/60 p-4">
            <div>
              <p className="text-sm font-semibold text-app-ink">Statut</p>
              <p className="mt-1 text-xs text-app-muted">
                {settings.telegramChatId ? 'Connecte' : 'Non connecte'}
              </p>
              <p className="mt-2 text-xs text-app-muted">
                Connectez le bot, cliquez Start, puis revenez ici et rafraichissez.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a className="btn-ghost" href="/account/notifications/telegram-connect">
                Connecter Telegram
              </a>
              {!settings.telegramChatId ? (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleRefreshTelegramStatus}
                  disabled={checkingTelegram}
                >
                  {checkingTelegram ? 'Verification...' : 'Verifier la connexion'}
                </button>
              ) : null}
              <button
                type="button"
                className="btn-ghost"
                onClick={handleDisconnectTelegram}
                disabled={!settings.telegramChatId || saving || checkingTelegram}
              >
                Deconnecter
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => handleTest('telegram')}
                disabled={!settings.telegramChatId || testing === 'telegram' || checkingTelegram}
              >
                {testing === 'telegram' ? 'Envoi en cours...' : 'Envoyer un test'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <div>
          {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
          {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
        </div>

        <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
