'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  APPLICATION_STATUSES,
  getStatusLabel,
  getStatusTone,
  type ApplicationStatus,
} from './status-meta'

type AnalyticsPayload = {
  totalApplications: number
  responseRate: number
  interviewsCount: number
  offersCount: number
  avgTimeToFirstResponseDays: number
  countsByStatus: Record<string, number>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseAnalyticsPayload(value: unknown): AnalyticsPayload | null {
  if (!isRecord(value)) return null

  const totalApplications = value.totalApplications
  const responseRate = value.responseRate
  const interviewsCount = value.interviewsCount
  const offersCount = value.offersCount
  const avgTimeToFirstResponseDays = value.avgTimeToFirstResponseDays
  const countsByStatus = value.countsByStatus

  if (
    typeof totalApplications !== 'number' ||
    typeof responseRate !== 'number' ||
    typeof interviewsCount !== 'number' ||
    typeof offersCount !== 'number' ||
    typeof avgTimeToFirstResponseDays !== 'number' ||
    !isRecord(countsByStatus)
  ) {
    return null
  }

  const normalizedCounts: Record<string, number> = {}
  for (const [key, raw] of Object.entries(countsByStatus)) {
    normalizedCounts[key] = typeof raw === 'number' ? raw : 0
  }

  return {
    totalApplications,
    responseRate,
    interviewsCount,
    offersCount,
    avgTimeToFirstResponseDays,
    countsByStatus: normalizedCounts,
  }
}

export function ApplicationAnalytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsPayload | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/applications/analytics', { cache: 'no-store' })
        const rawPayload: unknown = await response.json().catch(() => ({}))
        const parsedPayload = parseAnalyticsPayload(rawPayload)

        if (!response.ok) {
          const message =
            isRecord(rawPayload) && typeof rawPayload.error === 'string'
              ? rawPayload.error
              : 'Erreur de chargement des statistiques'
          throw new Error(message)
        }

        if (!parsedPayload) {
          throw new Error('Format de statistiques invalide')
        }

        if (active) {
          setData(parsedPayload)
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Erreur de chargement')
          setData(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  const counts = useMemo(() => {
    const base: Record<ApplicationStatus, number> = {
      BROUILLON: 0,
      EN_ATTENTE: 0,
      ENTRETIEN: 0,
      OFFRE: 0,
      REFUSE: 0,
    }

    if (!data?.countsByStatus) return base

    for (const status of APPLICATION_STATUSES) {
      const value = data.countsByStatus[status]
      base[status] = typeof value === 'number' ? value : 0
    }
    return base
  }, [data])

  if (loading) {
    return (
      <section className="panel panel-pad">
        <p className="text-sm text-app-muted">Chargement des statistiques...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="panel panel-pad border-amber-200 bg-amber-50 text-sm text-amber-900 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100">
        <strong>Stats indisponibles:</strong> {error}
      </section>
    )
  }

  if (!data) {
    return null
  }

  const responseRatePct = Math.round((data.responseRate ?? 0) * 1000) / 10
  const avgDays = Math.round((data.avgTimeToFirstResponseDays ?? 0) * 10) / 10

  return (
    <section className="panel panel-pad">
      <div className="grid gap-3 md:grid-cols-5">
        <div className="rounded-2xl border border-app-border bg-app-panel/60 p-3">
          <p className="text-xs font-semibold text-app-muted">Total</p>
          <p className="mt-1 text-2xl font-bold text-app-ink">{data.totalApplications}</p>
        </div>
        <div className="rounded-2xl border border-app-border bg-app-panel/60 p-3">
          <p className="text-xs font-semibold text-app-muted">Taux de reponse</p>
          <p className="mt-1 text-2xl font-bold text-app-ink">{responseRatePct}%</p>
        </div>
        <div className="rounded-2xl border border-app-border bg-app-panel/60 p-3">
          <p className="text-xs font-semibold text-app-muted">Entretiens</p>
          <p className="mt-1 text-2xl font-bold text-app-ink">{data.interviewsCount}</p>
        </div>
        <div className="rounded-2xl border border-app-border bg-app-panel/60 p-3">
          <p className="text-xs font-semibold text-app-muted">Offres</p>
          <p className="mt-1 text-2xl font-bold text-app-ink">{data.offersCount}</p>
        </div>
        <div className="rounded-2xl border border-app-border bg-app-panel/60 p-3">
          <p className="text-xs font-semibold text-app-muted">Delai moyen (j)</p>
          <p className="mt-1 text-2xl font-bold text-app-ink">{avgDays}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {APPLICATION_STATUSES.map((status) => (
          <span
            key={status}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${getStatusTone(status).chipClassName}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${getStatusTone(status).dotClassName}`} />
            <span className="font-medium">{getStatusLabel(status)}</span>
            <span className="rounded-full bg-app-panel/70 px-2 py-0.5 text-[11px] text-app-ink">
              {counts[status]}
            </span>
          </span>
        ))}
      </div>
    </section>
  )
}
