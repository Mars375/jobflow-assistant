import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { AppHeader } from '@/components/layout/app-header'
import { markJobAsSeen } from '@/app/actions/jobs'

type JobDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

function getSourceLabel(source: string): string {
  if (source === 'france-travail-api') return 'France Travail'
  if (source === 'adzuna-api') return 'Adzuna'
  return source
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params
  const session = await verifySession()
  if (!session) {
    redirect('/login')
  }

  const job = await prisma.jobPosting.findUnique({ where: { id } })
  if (!job) {
    redirect('/jobs')
  }

  await markJobAsSeen(id)

  const sourceLabel = getSourceLabel(job.source)
  const publishedAt = job.publishedAt ? new Date(job.publishedAt).toLocaleDateString('fr-FR') : 'Date indisponible'
  const fetchedAt = new Date(job.fetchedAt).toLocaleString('fr-FR')

  const query = new URLSearchParams()
  if (job.company) query.set('company', job.company)
  query.set('roleTitle', job.title)
  if (job.url) query.set('offerUrl', job.url)
  query.set('jobPostingId', job.id)
  const logApplicationHref = `/applications?${query.toString()}`

  return (
    <main className="app-shell">
      <AppHeader />

      <div className="app-page space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/jobs" className="btn-ghost px-3 py-2 text-xs">
            ← Retour aux offres
          </Link>

          <Link
            href={logApplicationHref}
            className="btn-primary"
          >
            Log candidature
          </Link>
        </div>

        <article className="panel panel-pad">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-app-ink">{job.title}</h1>
              <p className="mt-1 text-sm text-app-muted">{job.company || 'Entreprise non renseignee'}</p>
            </div>
            <span className="chip border-app-border bg-app-panel/70 text-app-ink">{sourceLabel}</span>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl border border-app-border bg-app-panel/50 p-4 text-sm text-app-muted md:grid-cols-2">
            <p><span className="font-medium">Localisation:</span> {job.location || 'Non renseignee'}</p>
            <p><span className="font-medium">Contrat:</span> {job.contractType || 'Non renseigne'}</p>
            <p><span className="font-medium">Salaire:</span> {job.salaryText || 'Selon profil'}</p>
            <p><span className="font-medium">Date publication:</span> {publishedAt}</p>
            <p className="md:col-span-2"><span className="font-medium">Origine de la requete:</span> {sourceLabel} ({job.sourceId})</p>
            <p className="md:col-span-2"><span className="font-medium">Derniere synchronisation:</span> {fetchedAt}</p>
          </div>

          <section className="mt-5">
            <h2 className="font-serif text-base font-semibold tracking-tight text-app-ink">Description</h2>
            <div className="mt-2 rounded-2xl border border-app-border bg-app-panel p-4 text-sm leading-6 text-app-ink">
              {job.description || 'Description non disponible pour cette offre.'}
            </div>
          </section>

          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-app-brand px-4 py-2 text-sm font-semibold text-white hover:bg-app-brand/90"
            >
              Voir l'annonce d'origine
            </a>
          )}
        </article>
      </div>
    </main>
  )
}
