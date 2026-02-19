'use client'

import { useState } from 'react'

type ExplanationPayload = {
  score: number
  method: 'semantic' | 'keyword'
  matchedKeywords: string[]
  missingKeywords: string[]
  titleMatch: boolean
}

type MatchExplanationProps = {
  jobId: string
}

export function MatchExplanation({ jobId }: MatchExplanationProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ExplanationPayload | null>(null)

  const handleOpen = async () => {
    setOpen(true)
    if (data || loading) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/jobs/${jobId}/match`, { cache: 'no-store' })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to fetch explanation')
      }
      const payload = (await response.json()) as ExplanationPayload
      setData(payload)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Unable to fetch explanation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-xs font-semibold text-app-brand hover:underline"
      >
        Why this match?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="panel max-h-[80vh] w-full max-w-lg overflow-y-auto p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h3 className="font-serif text-lg font-semibold tracking-tight text-app-ink">Match explanation</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm font-semibold text-app-muted hover:text-app-ink"
              >
                Close
              </button>
            </div>

            {loading && <p className="text-sm text-app-muted">Loading explanation...</p>}
            {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}

            {data && (
              <div className="space-y-4 text-sm">
                <p>
                  <span className="font-medium">Method:</span>{' '}
                  {data.method === 'semantic' ? 'AI semantic similarity' : 'Keyword fallback'}
                </p>
                <p>
                  <span className="font-medium">Score:</span> {data.score}%
                </p>

                <section>
                  <h4 className="mb-2 font-medium text-emerald-700">
                    Matched skills ({data.matchedKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.matchedKeywords.length === 0 ? (
                      <span className="text-app-muted">No direct skill overlap found.</span>
                    ) : (
                      data.matchedKeywords.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100"
                        >
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </section>

                <section>
                  <h4 className="mb-2 font-medium text-app-muted">
                    Missing skills ({data.missingKeywords.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.missingKeywords.slice(0, 12).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-app-border bg-app-panel/70 px-2 py-1 text-xs font-semibold text-app-ink"
                      >
                        {skill}
                      </span>
                    ))}
                    {data.missingKeywords.length > 12 && (
                      <span className="text-xs text-app-muted">+{data.missingKeywords.length - 12} more</span>
                    )}
                  </div>
                </section>

                {data.titleMatch && (
                  <p className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-100">
                    Your experience appears aligned with this role title.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
