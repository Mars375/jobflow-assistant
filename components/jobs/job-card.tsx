import Link from 'next/link'
import { MatchScore } from '@/components/jobs/match-score'
import { MatchExplanation } from '@/components/jobs/match-explanation'

type JobCardProps = {
  id: string
  source: string
  title: string
  company: string | null
  location: string | null
  contractType: string | null
  salaryText: string | null
  publishedAt: string | null
  relevanceScore: number
  isNew: boolean
  matchScore?: number
}

export function JobCard(props: JobCardProps) {
  const sourceLabel =
    props.source === 'france-travail-api'
      ? 'France Travail'
      : props.source === 'adzuna-api'
        ? 'Adzuna'
        : props.source

  return (
    <article className={`panel panel-pad relative overflow-hidden ${props.isNew ? 'border-amber-200' : ''}`}>
      {props.isNew && (
        <div className="absolute -right-10 top-4 rotate-12 bg-amber-500 px-12 py-1 text-xs font-semibold text-white shadow">
          Nouveau
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold tracking-tight text-app-ink">
            {props.title}
          </h3>
          <p className="mt-0.5 text-sm text-app-muted">
            {props.company || 'Entreprise non precisee'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-app-muted md:grid-cols-2">
        <p><span className="font-semibold text-app-ink">Source:</span> {sourceLabel}</p>
        <p><span className="font-semibold text-app-ink">Localisation:</span> {props.location || 'Non renseignee'}</p>
        <p><span className="font-semibold text-app-ink">Contrat:</span> {props.contractType || 'Non renseigne'}</p>
        <p><span className="font-semibold text-app-ink">Salaire:</span> {props.salaryText || 'Selon profil'}</p>
        <p>
          <span className="font-semibold text-app-ink">Date:</span>{' '}
          {props.publishedAt ? new Date(props.publishedAt).toLocaleDateString('fr-FR') : 'Date indisponible'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip border-app-border bg-app-panel/70 text-app-ink">
            Pertinence: {props.relevanceScore}/100
          </span>
          {typeof props.matchScore === 'number' && (
            <>
              <MatchScore score={props.matchScore} />
              <MatchExplanation jobId={props.id} />
            </>
          )}
        </div>
        <Link href={`/jobs/${props.id}`} className="btn-ghost px-3 py-2 text-xs">
          Ouvrir
        </Link>
      </div>
    </article>
  )
}
