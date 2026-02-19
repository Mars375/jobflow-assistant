import Link from 'next/link'
import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { AppHeader } from '@/components/layout/app-header'

export default async function DashboardPage() {
  const session = await verifySession()
  if (!session) {
    redirect('/login')
  }

  return (
    <main className="app-shell">
      <AppHeader />
      <div className="app-page">
        <h1 className="app-title">Tableau de bord</h1>
        <p className="app-subtitle">
          Continuez votre parcours: importez un CV, corrigez votre profil et explorez les offres.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href="/profile" className="panel panel-pad transition hover:shadow-lift">
            <h2 className="font-serif text-lg font-semibold tracking-tight">Profil CV</h2>
            <p className="mt-2 text-sm text-app-muted">
              Uploadez un CV et ajustez les informations extraites.
            </p>
          </Link>

          <Link href="/jobs" className="panel panel-pad transition hover:shadow-lift">
            <h2 className="font-serif text-lg font-semibold tracking-tight">Offres</h2>
            <p className="mt-2 text-sm text-app-muted">
              Filtrez les offres, voyez les details et suivez les nouveautes.
            </p>
          </Link>

          <Link href="/applications" className="panel panel-pad transition hover:shadow-lift">
            <h2 className="font-serif text-lg font-semibold tracking-tight">Candidatures</h2>
            <p className="mt-2 text-sm text-app-muted">
              Suivez vos postulations et preparez vos entretiens.
            </p>
          </Link>

          <Link href="/account" className="panel panel-pad transition hover:shadow-lift">
            <h2 className="font-serif text-lg font-semibold tracking-tight">Mon Compte</h2>
            <p className="mt-2 text-sm text-app-muted">
              Gerez la securite de votre compte et vos donnees GDPR.
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
