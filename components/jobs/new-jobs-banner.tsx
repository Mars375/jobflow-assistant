'use client'

type NewJobsBannerProps = {
  count: number
  onMarkAll: () => Promise<void>
}

export function NewJobsBanner({ count, onMarkAll }: NewJobsBannerProps) {
  if (count <= 0) {
    return null
  }

  return (
    <div className="panel panel-pad border-amber-200 bg-amber-50/60 dark:border-amber-300/30 dark:bg-amber-400/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
          {count} offre(s) Nouveau depuis votre derniere consultation.
        </p>
        <button
          type="button"
          onClick={() => {
            void onMarkAll()
          }}
          className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700"
        >
          Tout marquer comme vu
        </button>
      </div>
    </div>
  )
}
