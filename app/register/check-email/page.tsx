import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vérifiez votre email — JobFlow Assistant',
}

export default function CheckEmailPage() {
  return (
    <main className="app-shell flex items-center justify-center py-12">
      <div className="container mx-auto">
        <div className="mx-auto w-full max-w-md">
          <div className="panel panel-pad text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-sky-50 ring-1 ring-sky-200 dark:bg-sky-400/10 dark:ring-sky-300/30" />
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Verifiez votre boite email</h1>
            <p className="mt-3 text-sm text-app-muted">
              Un lien de verification a ete envoye a votre adresse email.
            </p>
            <div className="mt-4 space-y-2 text-sm text-app-muted">
              <p>Pensez a verifier le dossier spam si vous ne voyez rien.</p>
              <p>En local, l'envoi depend de la configuration (cle API + URL publique).</p>
              <p>Si vous avez deja un mot de passe valide, vous pouvez continuer vers la connexion.</p>
            </div>

            <div className="mt-6">
              <Link href="/login" className="btn-ghost inline-flex">
                Retour a la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
