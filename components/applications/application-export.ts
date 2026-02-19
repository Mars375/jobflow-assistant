'use client'

import type { ApplicationItem } from './application-board'
import { getStatusLabel } from './status-meta'

export function sourceLabel(source: string | null | undefined): string {
  if (!source) return ''
  if (source === 'france-travail-api') return 'France Travail'
  if (source === 'adzuna-api') return 'Adzuna'
  return source
}

export function hostnameFromUrl(value: string): string {
  try {
    const url = new URL(value)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function bestOfferUrl(app: ApplicationItem): string {
  const direct = typeof app.offerUrl === 'string' ? app.offerUrl : ''
  if (direct) return direct
  const fromJobPosting = typeof app.jobPosting?.url === 'string' ? app.jobPosting.url : ''
  return fromJobPosting || ''
}

export function contactLine(app: ApplicationItem): string {
  return [app.contactName, app.contactEmail, app.contactPhone]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' · ')
}

function csvEscape(value: unknown): string {
  const text =
    value == null
      ? ''
      : typeof value === 'string'
        ? value
        : typeof value === 'number'
          ? String(value)
          : typeof value === 'boolean'
            ? (value ? 'true' : 'false')
            : String(value)

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const escaped = normalized.replace(/"/g, '""')
  return `"${escaped}"`
}

function csvRow(fields: unknown[], delimiter: string): string {
  return fields.map(csvEscape).join(delimiter)
}

export function buildApplicationsCsv(applications: ApplicationItem[]): string {
  const delimiter = ';'
  const lines: string[] = []

  lines.push(
    csvRow(
      [
        'ID',
        'Statut',
        'Entreprise',
        'Poste',
        'Date',
        'Premiere reponse',
        'Derniere MAJ',
        'Site',
        'URL offre',
        'Origine',
        'Contact',
        'Salaire',
        'JobPostingId',
        'Notes',
      ],
      delimiter
    )
  )

  for (const app of applications) {
    const url = bestOfferUrl(app)
    const origin = sourceLabel(app.source || app.jobPosting?.source)
    const site = url ? hostnameFromUrl(url) : ''

    lines.push(
      csvRow(
        [
          app.id,
          getStatusLabel(app.status),
          app.company || app.jobPosting?.company || '',
          app.roleTitle || app.jobPosting?.title || '',
          app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('fr-FR') : '',
          app.firstResponseAt ? new Date(app.firstResponseAt).toLocaleDateString('fr-FR') : '',
          app.updatedAt ? new Date(app.updatedAt).toLocaleDateString('fr-FR') : '',
          site,
          url,
          origin,
          contactLine(app),
          app.salaryText || '',
          app.jobPostingId || '',
          app.notes || '',
        ],
        delimiter
      )
    )
  }

  const bom = '\uFEFF'
  return `${bom}${lines.join('\n')}\n`
}
