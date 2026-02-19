'use client'

import { useEffect, useMemo, useState } from 'react'
import { APPLICATION_STATUSES, type ApplicationStatus } from './status-meta'

export type ApplicationDraft = {
  company: string
  roleTitle: string
  status: ApplicationStatus
  appliedAtDate: string
  notes: string
  offerUrl: string
  source: string
  contactName: string
  contactEmail: string
  contactPhone: string
  salaryText: string
  jobPostingId: string
}

type ApplicationDrawerProps = {
  open: boolean
  mode: 'create' | 'edit'
  applicationId?: string
  initialValues?: Partial<ApplicationDraft>
  onClose: () => void
  onSaved: (application: any) => void
}

function statusLabel(status: ApplicationStatus): string {
  if (status === 'BROUILLON') return 'Brouillon'
  if (status === 'EN_ATTENTE') return 'En attente'
  if (status === 'ENTRETIEN') return 'Entretien'
  if (status === 'OFFRE') return 'Offre'
  return 'Refuse'
}

function isoToDateValue(value: unknown): string {
  if (typeof value !== 'string') return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  return ''
}

function dateValueToIso(value: string): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

export function ApplicationDrawer({
  open,
  mode,
  applicationId,
  initialValues,
  onClose,
  onSaved,
}: ApplicationDrawerProps) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [draft, setDraft] = useState<ApplicationDraft>({
    company: '',
    roleTitle: '',
    status: 'EN_ATTENTE',
    appliedAtDate: today,
    notes: '',
    offerUrl: '',
    source: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    salaryText: '',
    jobPostingId: '',
  })

  useEffect(() => {
    if (!open) return

    setError(null)
    setDraft((current) => ({
      ...current,
      company: initialValues?.company ?? current.company,
      roleTitle: initialValues?.roleTitle ?? current.roleTitle,
      status: initialValues?.status ?? current.status,
      appliedAtDate:
        initialValues?.appliedAtDate ?? current.appliedAtDate ?? today,
      notes: initialValues?.notes ?? current.notes,
      offerUrl: initialValues?.offerUrl ?? current.offerUrl,
      source: initialValues?.source ?? current.source,
      contactName: initialValues?.contactName ?? current.contactName,
      contactEmail: initialValues?.contactEmail ?? current.contactEmail,
      contactPhone: initialValues?.contactPhone ?? current.contactPhone,
      salaryText: initialValues?.salaryText ?? current.salaryText,
      jobPostingId: initialValues?.jobPostingId ?? current.jobPostingId,
    }))
  }, [initialValues, open, today])

  // Animation control
  useEffect(() => {
    if (open) {
      // Force browser to paint initial state before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
    }
  }, [open])

  const title = mode === 'create' ? 'Ajouter une candidature' : 'Modifier la candidature'

  const handleSubmit = async () => {
    if (!draft.company.trim() || !draft.roleTitle.trim()) {
      setError('Entreprise et poste sont requis.')
      return
    }

    setSaving(true)
    setError(null)

    const payload: Record<string, unknown> = {
      company: draft.company.trim(),
      roleTitle: draft.roleTitle.trim(),
      status: draft.status,
      ...(draft.appliedAtDate ? { appliedAt: dateValueToIso(draft.appliedAtDate) } : {}),
      ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
      ...(draft.offerUrl.trim() ? { offerUrl: draft.offerUrl.trim() } : {}),
      ...(draft.source.trim() ? { source: draft.source.trim() } : {}),
      ...(draft.contactName.trim() ? { contactName: draft.contactName.trim() } : {}),
      ...(draft.contactEmail.trim() ? { contactEmail: draft.contactEmail.trim() } : {}),
      ...(draft.contactPhone.trim() ? { contactPhone: draft.contactPhone.trim() } : {}),
      ...(draft.salaryText.trim() ? { salaryText: draft.salaryText.trim() } : {}),
      ...(draft.jobPostingId.trim() ? { jobPostingId: draft.jobPostingId.trim() } : {}),
    }

    try {
      const response = await fetch(
        mode === 'create' ? '/api/applications' : `/api/applications/${applicationId}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de sauvegarde')
      }

      const application = data.application
      if (!application) {
        throw new Error('Invalid response payload')
      }
      onSaved(application)
      onClose()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  // Don't render if not open and not animating
  if (!open && !isAnimating) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close application drawer"
        className={`drawer-overlay-transition absolute inset-0 bg-slate-950/35 backdrop-blur-[1px] ${isAnimating && open ? 'drawer-overlay-open' : 'drawer-overlay-closed'}`}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <div
        className={`drawer-panel-transition transform relative h-full w-full max-w-xl origin-right overflow-y-auto border-l border-app-border bg-app-panel p-5 shadow-2xl ${isAnimating && open ? 'drawer-panel-open' : 'drawer-panel-closed'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-app-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Fermer
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          <label className="text-sm text-app-muted">
            <span className="mb-1 block text-xs font-semibold text-app-ink">Entreprise *</span>
            <input
              value={draft.company}
              onChange={(event) => setDraft((prev) => ({ ...prev, company: event.target.value }))}
              className="input"
            />
          </label>

          <label className="text-sm text-app-muted">
            <span className="mb-1 block text-xs font-semibold text-app-ink">Poste *</span>
            <input
              value={draft.roleTitle}
              onChange={(event) => setDraft((prev) => ({ ...prev, roleTitle: event.target.value }))}
              className="input"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-app-muted">
              <span className="mb-1 block text-xs font-semibold text-app-ink">Statut</span>
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, status: event.target.value as ApplicationStatus }))
                }
                className="input"
              >
                {APPLICATION_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {statusLabel(value)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-app-muted">
              <span className="mb-1 block text-xs font-semibold text-app-ink">Date</span>
              <input
                type="date"
                value={draft.appliedAtDate}
                onChange={(event) => setDraft((prev) => ({ ...prev, appliedAtDate: event.target.value }))}
                className="input"
              />
            </label>
          </div>

          <label className="text-sm text-app-muted">
            <span className="mb-1 block text-xs font-semibold text-app-ink">Lien offre</span>
            <input
              value={draft.offerUrl}
              onChange={(event) => setDraft((prev) => ({ ...prev, offerUrl: event.target.value }))}
              className="input"
            />
          </label>

          <label className="text-sm text-app-muted">
            <span className="mb-1 block text-xs font-semibold text-app-ink">Notes</span>
            <textarea
              value={draft.notes}
              onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
              className="input min-h-[120px]"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-app-muted">
              <span className="mb-1 block text-xs font-semibold text-app-ink">Contact (nom)</span>
              <input
                value={draft.contactName}
                onChange={(event) => setDraft((prev) => ({ ...prev, contactName: event.target.value }))}
                className="input"
              />
            </label>
            <label className="text-sm text-app-muted">
              <span className="mb-1 block text-xs font-semibold text-app-ink">Contact (email)</span>
              <input
                value={draft.contactEmail}
                onChange={(event) => setDraft((prev) => ({ ...prev, contactEmail: event.target.value }))}
                className="input"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-app-muted">
              <span className="mb-1 block text-xs font-semibold text-app-ink">Contact (tel)</span>
              <input
                value={draft.contactPhone}
                onChange={(event) => setDraft((prev) => ({ ...prev, contactPhone: event.target.value }))}
                className="input"
              />
            </label>
            <label className="text-sm text-app-muted">
              <span className="mb-1 block text-xs font-semibold text-app-ink">Salaire</span>
              <input
                value={draft.salaryText}
                onChange={(event) => setDraft((prev) => ({ ...prev, salaryText: event.target.value }))}
                className="input"
              />
            </label>
          </div>

          <label className="text-sm text-app-muted">
            <span className="mb-1 block text-xs font-semibold text-app-ink">JobPostingId (optionnel)</span>
            <input
              value={draft.jobPostingId}
              onChange={(event) => setDraft((prev) => ({ ...prev, jobPostingId: event.target.value }))}
              className="input"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function draftFromApplication(application: any): Partial<ApplicationDraft> {
  return {
    company: typeof application?.company === 'string' ? application.company : '',
    roleTitle: typeof application?.roleTitle === 'string' ? application.roleTitle : '',
    status:
      APPLICATION_STATUSES.includes(application?.status)
        ? (application.status as ApplicationStatus)
        : 'EN_ATTENTE',
    appliedAtDate: isoToDateValue(application?.appliedAt),
    notes: typeof application?.notes === 'string' ? application.notes : '',
    offerUrl: typeof application?.offerUrl === 'string' ? application.offerUrl : '',
    source: typeof application?.source === 'string' ? application.source : '',
    contactName: typeof application?.contactName === 'string' ? application.contactName : '',
    contactEmail: typeof application?.contactEmail === 'string' ? application.contactEmail : '',
    contactPhone: typeof application?.contactPhone === 'string' ? application.contactPhone : '',
    salaryText: typeof application?.salaryText === 'string' ? application.salaryText : '',
    jobPostingId: typeof application?.jobPostingId === 'string' ? application.jobPostingId : '',
  }
}
