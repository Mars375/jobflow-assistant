import Link from 'next/link'

export default function VerifySuccessPage() {
  return (
    <main className="app-shell flex items-center justify-center py-12">
      <div className="container mx-auto">
        <div className="mx-auto w-full max-w-md">
          <div className="panel panel-pad text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:ring-emerald-300/30" />
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Email verifie</h1>
            <p className="mt-3 text-sm text-app-muted">
              Votre adresse email a ete verifiee. Vous pouvez maintenant vous connecter.
            </p>
            <div className="mt-6">
              <Link href="/login" className="btn-primary inline-flex">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
