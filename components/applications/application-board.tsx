
'use client'

import { useMemo } from 'react'
import {
  APPLICATION_STATUSES,
  getStatusLabel,
  getStatusTone,
  type ApplicationStatus,
} from './status-meta'

export type ApplicationItem = {
  id: string
  company: string
  roleTitle: string
  status: ApplicationStatus
  appliedAt: string
  updatedAt: string
  createdAt?: string
  firstResponseAt?: string | null

  offerUrl?: string | null
  source?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  salaryText?: string | null
  notes?: string | null
  jobPostingId?: string | null
  jobPosting?: {
    id: string
    source: string
    url: string | null
    title: string
    company: string | null
  } | null
}

type ApplicationBoardProps = {
  applications: ApplicationItem[]
  onChangeStatus: (id: string, status: ApplicationStatus) => void
  onSelect?: (application: ApplicationItem) => void
}

export function ApplicationBoard({ applications, onChangeStatus, onSelect }: ApplicationBoardProps) {
  const groups = useMemo(() => {
    const map = new Map<ApplicationStatus, ApplicationItem[]>()
    for (const status of APPLICATION_STATUSES) {
      map.set(status, [])
    }
    for (const item of applications) {
      const bucket = map.get(item.status)
      if (bucket) bucket.push(item)
    }
    return map
  }, [applications])

  return (
    <section className="grid gap-4 lg:grid-cols-5">
      {APPLICATION_STATUSES.map((status) => {
        const items = groups.get(status) ?? []
        const tone = getStatusTone(status)

        return (
          <div
            key={status}
            className={`rounded-2xl border p-3 shadow-sm ${tone.columnClassName}`}
            onDragOver={(event) => {
              event.preventDefault()
            }}
            onDrop={(event) => {
              event.preventDefault()
              const id = event.dataTransfer.getData('applicationId')
              if (id) {
                onChangeStatus(id, status)
              }
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-app-ink">
                <span className={`h-2 w-2 rounded-full ${tone.dotClassName}`} />
                {getStatusLabel(status)}
              </h2>
              <span className="rounded-full border border-app-border bg-app-panel/70 px-2 py-0.5 text-xs text-app-muted">
                {items.length}
              </span>
            </div>

            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-app-border bg-app-panel/40 px-3 py-4 text-xs text-app-muted">
                Aucune candidature.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('applicationId', item.id)
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                    onClick={() => onSelect?.(item)}
                    className="cursor-pointer rounded-xl border border-app-border bg-app-panel/70 p-3 shadow-sm hover:bg-app-panel"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-app-ink">{item.company}</p>
                        <p className="mt-0.5 text-xs text-app-muted">{item.roleTitle}</p>
                      </div>
                      <select
                        value={item.status}
                        onChange={(event) =>
                          onChangeStatus(item.id, event.target.value as ApplicationStatus)
                        }
                        className="rounded-lg border border-app-border bg-app-panel px-2 py-1 text-xs text-app-ink"
                        aria-label="Changer le statut"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {APPLICATION_STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {getStatusLabel(value)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Appliquee le {new Date(item.appliedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
