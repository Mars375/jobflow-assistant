'use client'

import { useEffect, useState, useTransition } from 'react'
import { type JobFilters, saveJobFilters } from '@/app/actions/jobs'

type JobFiltersProps = {
  value: JobFilters
  onChange: (next: JobFilters) => void
  onReset: () => void
  onSync?: () => void
  isSyncing?: boolean
}

export function JobFilters({ value, onChange, onReset, onSync, isSyncing }: JobFiltersProps) {
  const [local, setLocal] = useState<JobFilters>(value)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(local)
      startTransition(async () => {
        await saveJobFilters(local)
      })
    }, 150)

    return () => clearTimeout(timeout)
  }, [local, onChange, startTransition])

  return (
    <section className="panel panel-pad">
      <h2 className="font-serif text-base font-semibold tracking-tight text-app-ink">Filtres (instant)</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <input
          value={local.keyword}
          onChange={(event) => setLocal((prev) => ({ ...prev, keyword: event.target.value }))}
          placeholder="Mot-cle"
          className="input"
        />
        <input
          value={local.location}
          onChange={(event) => setLocal((prev) => ({ ...prev, location: event.target.value }))}
          placeholder="Ville / region"
          className="input"
        />
        <input
          value={local.contractType}
          onChange={(event) => setLocal((prev) => ({ ...prev, contractType: event.target.value }))}
          placeholder="Type de contrat"
          className="input"
        />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onReset}
          className="btn-ghost px-3 py-2 text-xs"
        >
          Reinitialiser
        </button>
        {onSync && (
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="btn-primary px-3 py-2 text-xs disabled:opacity-60"
          >
            {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        )}
      </div>
    </section>
  )
}
