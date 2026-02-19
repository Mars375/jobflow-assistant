'use client'

import type { ApplicationItem } from './application-board'
import {
  APPLICATION_STATUSES,
  getStatusLabel,
  getStatusTone,
  type ApplicationStatus,
} from './status-meta'
import { bestOfferUrl, contactLine, hostnameFromUrl, sourceLabel } from './application-export'

type ApplicationTableProps = {
  applications: ApplicationItem[]
  onSelect: (application: ApplicationItem) => void
  onChangeStatus: (id: string, status: ApplicationStatus) => void
}

export function ApplicationTable({ applications, onSelect, onChangeStatus }: ApplicationTableProps) {
  return (
    <section className="panel">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="sticky top-0 z-10 bg-app-panel/70 text-left text-xs font-semibold uppercase tracking-wide text-app-muted">
            <tr>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Entreprise</th>
              <th className="px-4 py-3">Poste</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Site</th>
              <th className="px-4 py-3">Origine</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {applications.map((app) => {
              const url = bestOfferUrl(app)
              const site = url ? hostnameFromUrl(url) : ''
              const origin = sourceLabel(app.source || app.jobPosting?.source)
              const tone = getStatusTone(app.status)
              const contact = contactLine(app)

              return (
                <tr key={app.id} className="hover:bg-app-panel/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${tone.dotClassName}`} />
                      <select
                        value={app.status}
                        onChange={(event) => onChangeStatus(app.id, event.target.value as ApplicationStatus)}
                        className={`rounded-lg border px-2 py-1 text-xs ${tone.chipClassName}`}
                        aria-label="Changer le statut"
                      >
                        {APPLICATION_STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {getStatusLabel(value)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-app-ink">
                    {app.company || app.jobPosting?.company || ''}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    {app.roleTitle || app.jobPosting?.title || ''}
                  </td>
                  <td className="px-4 py-3 text-app-muted">
                    {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('fr-FR') : ''}
                  </td>
                  <td className="px-4 py-3">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-app-brand hover:underline"
                        title={url}
                      >
                        {site || 'Lien'}
                      </a>
                    ) : (
                      <span className="text-app-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-app-muted">{origin || <span className="text-app-muted">—</span>}</td>
                  <td className="px-4 py-3 text-app-muted">{contact || <span className="text-app-muted">—</span>}</td>
                  <td className="px-4 py-3 text-app-muted">
                    {app.notes ? (
                      <span className="line-clamp-2 max-w-[320px]">{app.notes}</span>
                    ) : (
                      <span className="text-app-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(app)}
                      className="btn-ghost px-3 py-2 text-xs"
                    >
                      Ouvrir
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
