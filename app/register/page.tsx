import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <main className="app-shell flex items-center justify-center py-12">
      <div className="container mx-auto">
        <div className="mx-auto w-full max-w-md">
          <div className="panel panel-pad">
            <div className="text-center">
              <p className="font-serif text-2xl font-semibold tracking-tight">JobFlow</p>
              <h1 className="mt-2 text-xl font-semibold">Creer un compte</h1>
              <p className="mt-1 text-sm text-app-muted">
                Demarrez le suivi de vos offres et candidatures, sans friction.
              </p>
            </div>

            <RegisterForm />

            <p className="mt-6 text-center text-sm text-app-muted">
              Deja un compte ?{' '}
              <a href="/login" className="font-semibold text-app-brand hover:underline">
                Se connecter
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
