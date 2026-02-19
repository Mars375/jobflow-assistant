'use client'

export const APPLICATION_STATUSES = [
  'BROUILLON',
  'EN_ATTENTE',
  'ENTRETIEN',
  'OFFRE',
  'REFUSE',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export function getStatusLabel(status: ApplicationStatus): string {
  if (status === 'BROUILLON') return 'Brouillon'
  if (status === 'EN_ATTENTE') return 'En attente'
  if (status === 'ENTRETIEN') return 'Entretien'
  if (status === 'OFFRE') return 'Offre'
  return 'Refuse'
}

export function getStatusTone(status: ApplicationStatus): {
  dotClassName: string
  chipClassName: string
  columnClassName: string
} {
  if (status === 'BROUILLON') {
    return {
      dotClassName: 'bg-slate-400',
      chipClassName: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/40 dark:text-slate-100 dark:border-slate-700',
      columnClassName: 'bg-app-panel',
    }
  }

  if (status === 'EN_ATTENTE') {
    return {
      dotClassName: 'bg-amber-500',
      chipClassName: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-400/10 dark:text-amber-100 dark:border-amber-300/30',
      columnClassName: 'bg-amber-50/30',
    }
  }

  if (status === 'ENTRETIEN') {
    return {
      dotClassName: 'bg-sky-500',
      chipClassName: 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-400/10 dark:text-sky-100 dark:border-sky-300/30',
      columnClassName: 'bg-sky-50/30',
    }
  }

  if (status === 'OFFRE') {
    return {
      dotClassName: 'bg-emerald-500',
      chipClassName: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-100 dark:border-emerald-300/30',
      columnClassName: 'bg-emerald-50/30',
    }
  }

  return {
    dotClassName: 'bg-rose-500',
    chipClassName: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-400/10 dark:text-rose-100 dark:border-rose-300/30',
    columnClassName: 'bg-rose-50/30',
  }
}
