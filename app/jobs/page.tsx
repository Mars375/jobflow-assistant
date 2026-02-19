'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppHeader } from '@/components/layout/app-header'
import { JobCard } from '@/components/jobs/job-card'
import { JobFilters } from '@/components/jobs/job-filters'
import { NewJobsBanner } from '@/components/jobs/new-jobs-banner'
import { getSavedJobFilters, markAllJobsAsSeen, type JobFilters as Filters } from '@/app/actions/jobs'

type JobItem = {
  id: string
  source: string
  title: string
  company: string | null
  location: string | null
  contractType: string | null
  description: string | null
  salaryText: string | null
  publishedAt: string | null
  relevanceScore: number
  matchScore?: number
  isNew: boolean
}

const EMPTY_FILTERS: Filters = {
  keyword: '',
  location: '',
  contractType: '',
}

export default function JobsPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'match'>('match')
  const [matchThreshold, setMatchThreshold] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const unreadCount = useMemo(() => jobs.filter((job) => job.isNew).length, [jobs])

  const fetchJobs = useCallback(async (nextFilters: Filters) => {
    const params = new URLSearchParams()
    if (nextFilters.keyword) params.set('keyword', nextFilters.keyword)
    if (nextFilters.location) params.set('location', nextFilters.location)
    if (nextFilters.contractType) params.set('contractType', nextFilters.contractType)
    params.set('sort', sortBy)
    if (sortBy === 'match' && matchThreshold > 0) {
      params.set('matchThreshold', String(matchThreshold))
    }

    const response = await fetch(`/api/jobs?${params.toString()}`, { cache: 'no-store' })
    if (!response.ok) {
      setJobs([])
      return
    }

    const payload = await response.json()
    setJobs(Array.isArray(payload.jobs) ? payload.jobs : [])
  }, [matchThreshold, sortBy])

  useEffect(() => {
    let active = true

    async function init() {
      const saved = await getSavedJobFilters()
      if (!active) return
      const merged = {
        keyword: saved.keyword || '',
        location: saved.location || '',
        contractType: saved.contractType || '',
      }
      setFilters(merged)
      await fetchJobs(merged)
      if (active) setLoading(false)
    }

    void init()
    return () => {
      active = false
    }
  }, [fetchJobs])

  const handleFiltersChange = useCallback(
    (nextFilters: Filters) => {
      setFilters(nextFilters)
      void fetchJobs(nextFilters)
    },
    [fetchJobs]
  )

  const handleReset = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    void fetchJobs(EMPTY_FILTERS)
  }, [fetchJobs])

  const handleMarkAll = useCallback(async () => {
    await markAllJobsAsSeen()
    await fetchJobs(filters)
  }, [fetchJobs, filters])

  const [syncError, setSyncError] = useState<string | null>(null)

  const handleSync = useCallback(async () => {
    setIsSyncing(true)
    setSyncError(null)
    try {
      const response = await fetch('/api/jobs/sync', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) {
        setSyncError(data.error || 'Erreur de synchronisation')
        console.error('[Sync] Error:', data)
      } else {
        console.log('[Sync] Success:', data)
        await fetchJobs(filters)
      }
    } catch (err) {
      setSyncError('Erreur réseau')
      console.error('[Sync] Network error:', err)
    } finally {
      setIsSyncing(false)
    }
  }, [fetchJobs, filters])

  useEffect(() => {
    if (!loading) {
      void fetchJobs(filters)
    }
  }, [sortBy, matchThreshold, loading, fetchJobs, filters])

  return (
    <main className="app-shell">
      <AppHeader />

      <div className="app-page space-y-5">
        <h1 className="app-title">Offres</h1>
        <p className="app-subtitle">
          Explorez les offres France Travail avec filtres instantanes, classement par pertinence et signalement Nouveau.
        </p>

        <NewJobsBanner count={unreadCount} onMarkAll={handleMarkAll} />
        <JobFilters 
          value={filters} 
          onChange={handleFiltersChange} 
          onReset={handleReset} 
          onSync={handleSync}
          isSyncing={isSyncing}
        />

        <section className="panel panel-pad">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-app-muted">
              <span>Trier par:</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'newest' | 'match')}
                className="rounded-xl border border-app-border bg-app-panel px-3 py-2 text-sm text-app-ink shadow-sm"
              >
                <option value="match">Best match</option>
                <option value="newest">Newest first</option>
              </select>
            </label>

            {sortBy === 'match' && (
              <label className="flex items-center gap-3 text-sm text-app-muted">
                <span>Match min:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={10}
                  value={matchThreshold}
                  onChange={(event) => setMatchThreshold(Number(event.target.value))}
                />
                <span className="font-semibold text-app-ink">{matchThreshold}%+</span>
              </label>
            )}
          </div>
        </section>

        {syncError && (
          <div className="panel panel-pad border-rose-200 bg-rose-50 text-sm text-rose-800 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-100">
            <strong>Erreur de synchronisation:</strong> {syncError}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-app-muted">Chargement des offres...</p>
        ) : jobs.length === 0 ? (
          <div className="panel panel-pad text-sm text-app-muted">
            <p className="mb-2">Aucune offre trouvee.</p>
            <p>Cliquez sur le bouton <strong>&quot;Synchroniser&quot;</strong> ci-dessus pour importer les offres depuis France Travail.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                id={job.id}
                source={job.source}
                title={job.title}
                company={job.company}
                location={job.location}
                contractType={job.contractType}
                salaryText={job.salaryText}
                publishedAt={job.publishedAt}
                relevanceScore={job.relevanceScore}
                matchScore={job.matchScore}
                isNew={job.isNew}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
