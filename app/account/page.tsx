import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { PasswordSection } from '@/components/account/password-section'
import { GDPRSection } from '@/components/account/gdpr-section'
import { AppHeader } from '@/components/layout/app-header'

export default async function AccountPage() {
  const session = await verifySession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true, createdAt: true, gdprConsentedAt: true }
  })

  if (!user) redirect('/login')

  return (
    <main className="app-shell">
      <AppHeader />
      <div className="app-page max-w-3xl">
        <h1 className="app-title">Mon Compte</h1>
        <p className="app-subtitle">Securite, export, et controle de vos donnees.</p>

        <section className="panel panel-pad mt-8">
          <h2 className="font-serif text-lg font-semibold tracking-tight">Profil</h2>
          <div className="mt-4 grid gap-3 text-sm text-app-muted md:grid-cols-2">
            <p><span className="font-semibold text-app-ink">Email:</span> {user.email}</p>
            <p><span className="font-semibold text-app-ink">Nom:</span> {user.name || '—'}</p>
            <p><span className="font-semibold text-app-ink">Membre depuis:</span> {user.createdAt.toLocaleDateString('fr-FR')}</p>
            {user.gdprConsentedAt && (
              <p><span className="font-semibold text-app-ink">Consentement GDPR:</span> {user.gdprConsentedAt.toLocaleDateString('fr-FR')}</p>
            )}
          </div>
        </section>

        <section className="panel panel-pad mt-6">
          <h2 className="font-serif text-lg font-semibold tracking-tight">Securite</h2>
          <div className="mt-4">
            <PasswordSection />
          </div>
        </section>

        <section className="panel panel-pad mt-6">
          <h2 className="font-serif text-lg font-semibold tracking-tight">Vos donnees (GDPR)</h2>
          <div className="mt-4">
            <GDPRSection />
          </div>
        </section>
      </div>
    </main>
  )
}
