import Link from 'next/link'

interface VerifyPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams
  const status = params.status

  const messages: Record<string, { title: string; description: string }> = {
    missing: {
      title: 'Lien invalide',
      description: 'Lien de vérification invalide. Vérifiez que vous avez copié le lien complet.'
    },
    invalid: {
      title: 'Lien expiré ou déjà utilisé',
      description: 'Ce lien de vérification est expiré ou a déjà été utilisé.'
    }
  }

  const message = messages[status || ''] || {
    title: 'Erreur de vérification',
    description: 'Une erreur est survenue lors de la vérification de votre email.'
  }

  return (
    <main className="app-shell flex items-center justify-center py-12">
      <div className="container mx-auto">
        <div className="mx-auto w-full max-w-md">
          <div className="panel panel-pad text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:ring-amber-300/30" />
            <h1 className="font-serif text-2xl font-semibold tracking-tight">{message.title}</h1>
            <p className="mt-3 text-sm text-app-muted">{message.description}</p>
            <div className="mt-6">
              <Link href="/login" className="btn-primary inline-flex">
                Retour a la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
