'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppHeader } from '@/components/layout/app-header'
import {
  ApplicationBoard,
  type ApplicationItem,
} from '@/components/applications/application-board'
import { APPLICATION_STATUSES, type ApplicationStatus } from '@/components/applications/status-meta'
import {
  ApplicationDrawer,
  draftFromApplication,
  type ApplicationDraft,
} from '@/components/applications/application-drawer'
import { ApplicationAnalytics } from '@/components/applications/application-analytics'
import { ApplicationTable } from '@/components/applications/application-table'
import { buildApplicationsCsv } from '@/components/applications/application-export'

type Filters = {
  status: 'all' | ApplicationStatus
  company: string
  from: string
  to: string
}

const EMPTY_FILTERS: Filters = {
  status: 'all',
  company: '',
  from: '',
  to: '',
}

export default function ApplicationsPage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell">
          <AppHeader />
          <div className="app-page">
            <p className="text-sm text-app-muted">Chargement...</p>
          </div>
        </main>
      }
    >
      <ApplicationsPageContent />
    </Suspense>
  )
}

function ApplicationsPageContent() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create')
  const [drawerApplicationId, setDrawerApplicationId] = useState<string | undefined>(undefined)
  const [drawerInitial, setDrawerInitial] = useState<Partial<ApplicationDraft> | undefined>(undefined)
  const bootstrappedFromQuery = useRef(false)

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')

  const handleExportCsv = useCallback(() => {
    const csv = buildApplicationsCsv(applications)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const date = new Date().toISOString().slice(0, 10)
    const link = document.createElement('a')
    link.href = url
    link.download = `candidatures-${date}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [applications])

  const fetchApplications = useCallback(async (nextFilters: Filters) => {
    const params = new URLSearchParams()
    if (nextFilters.status !== 'all') params.set('status', nextFilters.status)
    if (nextFilters.company) params.set('company', nextFilters.company)
    if (nextFilters.from) params.set('from', nextFilters.from)
    if (nextFilters.to) params.set('to', nextFilters.to)

    const response = await fetch(`/api/applications?${params.toString()}`, { cache: 'no-store' })
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setApplications([])
      setError(payload.error || 'Erreur de chargement des candidatures')
      return
    }

    const payload = await response.json()
    setApplications(Array.isArray(payload.applications) ? payload.applications : [])
  }, [])

  useEffect(() => {
    let active = true

    async function init() {
      setLoading(true)
      setError(null)
      await fetchApplications(filters)
      if (active) setLoading(false)
    }

    void init()
    return () => {
      active = false
    }
  }, [fetchApplications, filters])

  useEffect(() => {
    if (bootstrappedFromQuery.current) return

    const company = searchParams.get('company')?.trim() ?? ''
    const roleTitle = searchParams.get('roleTitle')?.trim() ?? ''
    const offerUrl = searchParams.get('offerUrl')?.trim() ?? ''
    const jobPostingId = searchParams.get('jobPostingId')?.trim() ?? ''

    if (company || roleTitle || offerUrl || jobPostingId) {
      setDrawerMode('create')
      setDrawerApplicationId(undefined)
      setDrawerInitial({
        company,
        roleTitle,
        offerUrl,
        jobPostingId,
        status: 'EN_ATTENTE',
      })
      setDrawerOpen(true)
    }

    bootstrappedFromQuery.current = true
  }, [searchParams])

  const statusOptions = useMemo(
    () => [
      { value: 'all' as const, label: 'Tous' },
      ...APPLICATION_STATUSES.map((status) => ({
        value: status,
        label:
          status === 'BROUILLON'
            ? 'Brouillon'
            : status === 'EN_ATTENTE'
              ? 'En attente'
              : status === 'ENTRETIEN'
                ? 'Entretien'
                : status === 'OFFRE'
                  ? 'Offre'
                  : 'Refuse',
      })),
    ],
    []
  )

  const handleChangeStatus = useCallback(
    async (id: string, nextStatus: ApplicationStatus) => {
      const previous = applications
      const current = applications.find((item) => item.id === id)
      if (!current || current.status === nextStatus) return

      setError(null)
      setApplications((items) =>
        items.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
      )

      try {
        const response = await fetch(`/api/applications/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        })

        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload.error || 'Impossible de mettre a jour la candidature')
        }

        if (payload.application) {
          setApplications((items) =>
            items.map((item) => (item.id === id ? payload.application : item))
          )
        }
      } catch (patchError) {
        setApplications(previous)
        setError(patchError instanceof Error ? patchError.message : 'Erreur de mise a jour')
      }
    },
    [applications]
  )

  return (
    <main className="app-shell">
      <AppHeader />

      <div className="app-page space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="app-title">Candidatures</h1>
            <p className="app-subtitle">
              Suivez vos postulations manuelles et mettez a jour les statuts en glissant-deposant.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-app-border bg-app-panel p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={
                  viewMode === 'kanban'
                    ? 'rounded-lg border border-app-border bg-app-bg/70 px-3 py-2 text-xs font-semibold text-app-ink shadow-inner'
                    : 'rounded-lg px-3 py-2 text-xs font-semibold text-app-ink hover:bg-app-panel/80 dark:hover:bg-app-bg/50'
                }
              >
                Kanban
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={
                  viewMode === 'table'
                    ? 'rounded-lg border border-app-border bg-app-bg/70 px-3 py-2 text-xs font-semibold text-app-ink shadow-inner'
                    : 'rounded-lg px-3 py-2 text-xs font-semibold text-app-ink hover:bg-app-panel/80 dark:hover:bg-app-bg/50'
                }
              >
                Tableau
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setDrawerMode('create')
                setDrawerApplicationId(undefined)
                setDrawerInitial(undefined)
                setDrawerOpen(true)
              }}
              className="btn-primary"
            >
              Ajouter
            </button>

            {viewMode === 'table' && applications.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="btn-ghost"
              >
                Exporter CSV
              </button>
            )}
          </div>
        </div>

        <section className="panel panel-pad">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm text-app-muted">
              <span className="mb-1 block text-xs font-semibold text-app-ink">Statut</span>
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: event.target.value as Filters['status'],
                  }))
                }
                className="input"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-app-muted">
              <span className="mb-1 block text-xs font-semibold text-app-ink">Entreprise</span>
              <input
                value={filters.company}
                onChange={(event) => setFilters((prev) => ({ ...prev, company: event.target.value }))}
                placeholder="Rechercher..."
                className="input"
              />
            </label>

            <label className="text-sm text-app-muted">
              <span className="mb-1 block text-xs font-semibold text-app-ink">Du</span>
              <input
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
                className="input"
              />
            </label>

            <label className="text-sm text-app-muted">
              <span className="mb-1 block text-xs font-semibold text-app-ink">Au</span>
              <input
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
                className="input"
              />
            </label>
          </div>
        </section>

        <ApplicationAnalytics />

        {error && (
          <div className="panel panel-pad border-rose-200 bg-rose-50 text-sm text-rose-800 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-100">
            <strong>Erreur:</strong> {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-app-muted">Chargement des candidatures...</p>
        ) : applications.length === 0 ? (
          <div className="panel panel-pad text-sm text-app-muted">
            <p className="mb-1">Aucune candidature enregistree.</p>
            <p>Ajoutez une candidature depuis une offre ou via le bouton Ajouter.</p>
          </div>
        ) : viewMode === 'table' ? (
          <ApplicationTable
            applications={applications}
            onChangeStatus={handleChangeStatus}
            onSelect={(application) => {
              setDrawerMode('edit')
              setDrawerApplicationId(application.id)
              setDrawerInitial(draftFromApplication(application))
              setDrawerOpen(true)
            }}
          />
        ) : (
          <ApplicationBoard
            applications={applications}
            onChangeStatus={handleChangeStatus}
            onSelect={(application) => {
              setDrawerMode('edit')
              setDrawerApplicationId(application.id)
              setDrawerInitial(draftFromApplication(application))
              setDrawerOpen(true)
            }}
          />
        )}

      </div>

      <ApplicationDrawer
        open={drawerOpen}
        mode={drawerMode}
        applicationId={drawerApplicationId}
        initialValues={drawerInitial}
        onClose={() => setDrawerOpen(false)}
        onSaved={(saved) => {
          if (!saved || typeof saved.id !== 'string') {
            void fetchApplications(filters)
            return
          }

          setApplications((items) => {
            const exists = items.some((item) => item.id === saved.id)
            if (exists) {
              return items.map((item) => (item.id === saved.id ? saved : item))
            }
            return [saved, ...items]
          })
        }}
      />
    </main>
  )
}
