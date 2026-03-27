import Link from 'next/link'
import { JobCard } from '@/components/jobs/job-card'

const previewJobs = [
  {
    id: 'demo-1',
    source: 'france-travail-api',
    title: 'Développeur Full Stack React/Node.js',
    company: 'Startup SaaS Paris',
    location: 'Paris (75)',
    contractType: 'CDI',
    salaryText: '45-55k€',
    publishedAt: new Date().toISOString(),
    relevanceScore: 88,
    isNew: true,
  },
  {
    id: 'demo-2',
    source: 'adzuna-api',
    title: 'Ingénieur Logiciel TypeScript',
    company: 'Scale-up Tech',
    location: 'Lyon (69)',
    contractType: 'CDI',
    salaryText: '42-50k€',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    relevanceScore: 74,
    isNew: false,
  },
  {
    id: 'demo-3',
    source: 'france-travail-api',
    title: 'Développeur Next.js — Remote OK',
    company: 'Agence Digitale',
    location: 'Remote',
    contractType: 'CDD',
    salaryText: 'Selon profil',
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    relevanceScore: 61,
    isNew: false,
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center text-center px-4">
        {/* Nav */}
        <nav className="w-full max-w-5xl flex items-center justify-between py-5 mx-auto">
          <span className="font-serif text-lg font-semibold tracking-tight text-app-ink">
            JobFlow
          </span>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">
              Connexion
            </Link>
            <Link href="/register" className="btn-primary">
              Commencer
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="mt-16 mb-20 max-w-2xl">
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-app-ink leading-tight md:text-6xl">
            Trouvez les offres<br />qui vous correspondent.
          </h1>
          <p className="mt-6 text-base text-app-muted max-w-xl mx-auto leading-relaxed">
            Agrégation France Travail + Adzuna, matching sémantique par CV, suivi Kanban des candidatures.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/demo" className="btn-primary px-6 py-3 text-base">
              Voir la démo
            </Link>
            <Link href="/login" className="btn-ghost px-6 py-3 text-base">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="panel panel-pad flex flex-col gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-brand/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-app-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-app-ink">Offres agrégées</h3>
              <p className="mt-2 text-sm text-app-muted leading-relaxed">
                France Travail + Adzuna. Filtre par localisation, type de contrat, mots-clés.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="panel panel-pad flex flex-col gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-brand2/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-app-brand2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-app-ink">Matching sémantique</h3>
              <p className="mt-2 text-sm text-app-muted leading-relaxed">
                Score de compatibilité calculé à partir de votre CV. Embeddings OpenAI + pgvector.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="panel panel-pad flex flex-col gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-brand/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-app-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-app-ink">Suivi Kanban</h3>
              <p className="mt-2 text-sm text-app-muted leading-relaxed">
                De la candidature à l&apos;offre — BROUILLON, EN ATTENTE, ENTRETIEN, OFFRE, REFUSÉ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Preview strip */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="app-title mb-6">Aperçu des offres</h2>
        <div className="relative">
          <div className="grid gap-4 md:grid-cols-3">
            {previewJobs.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}
          </div>
          {/* Fade-out gradient overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-app-bg to-transparent" />
        </div>
        <div className="mt-6 text-center">
          <Link href="/demo" className="text-sm font-semibold text-app-brand hover:text-app-brand/80">
            Voir la démo complète →
          </Link>
        </div>
      </section>

      {/* CTA footer strip */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="panel panel-pad mx-auto max-w-xl flex flex-col items-center gap-5">
          <h2 className="font-serif text-2xl font-semibold text-app-ink">
            Prêt à optimiser votre recherche ?
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-primary px-6 py-3">
              Créer un compte
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost px-6 py-3"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
