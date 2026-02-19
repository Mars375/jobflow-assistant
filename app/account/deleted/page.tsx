import Link from 'next/link'

export default function DeletedPage() {
  return (
    <main className="app-shell flex items-center justify-center py-12">
      <div className="container mx-auto">
        <div className="mx-auto w-full max-w-md">
          <div className="panel panel-pad text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-400/10 dark:ring-rose-300/30" />
            <h1 className="font-serif text-2xl font-semibold tracking-tight">Compte supprime</h1>
            <p className="mt-3 text-sm text-app-muted">
              Toutes vos données ont été définitivement supprimées.
            </p>
            <p className="mt-2 text-sm text-app-muted">
              Si vous souhaitez utiliser JobFlow a nouveau, vous pouvez creer un nouveau compte.
            </p>

            <div className="mt-6 space-y-3">
              <Link href="/" className="btn-primary block">
                Retour a l'accueil
              </Link>
              <Link href="/register" className="btn-ghost block">
                Creer un nouveau compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
