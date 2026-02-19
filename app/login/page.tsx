import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <main className="app-shell flex items-center justify-center py-12">
      <div className="container mx-auto">
        <div className="mx-auto w-full max-w-md">
          <div className="panel panel-pad">
            <div className="text-center">
              <p className="font-serif text-2xl font-semibold tracking-tight">JobFlow</p>
              <h1 className="mt-2 text-xl font-semibold">Connexion</h1>
              <p className="mt-1 text-sm text-app-muted">
                Accedez a votre tableau de bord et reprenez votre pipeline.
              </p>
              <p className="mt-3 text-xs text-app-muted">
                En local, la reception d&apos;emails depend de la configuration d&apos;envoi.
              </p>
            </div>

            <LoginForm />

            <p className="mt-6 text-center text-sm text-app-muted">
              Pas encore de compte ?{' '}
              <a href="/register" className="font-semibold text-app-brand hover:underline">
                Creer un compte
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
