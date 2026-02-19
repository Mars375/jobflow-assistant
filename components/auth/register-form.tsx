'use client'

import { useFormState } from 'react-dom'
import { register } from '@/app/actions/auth'
import { FormState } from '@/types/form'

const initialState: FormState = { message: '', errors: {} }

export function RegisterForm() {
  const [state, formAction] = useFormState(register, initialState)

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nom
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="input mt-1"
          placeholder="Jean Dupont"
        />
        {state.errors?.name && (
          <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input mt-1"
          placeholder="jean.dupont@example.com"
        />
        {state.errors?.email && (
          <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={55}
          title="Must contain 8+ chars, uppercase, lowercase, number, special char"
          className="input mt-1"
        />
        {state.errors?.password && (
          <p className="mt-1 text-sm text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      <div className="rounded-2xl border border-app-border bg-app-panel p-4">
        <div className="flex items-start">
          <input
            id="gdprConsent"
            name="gdprConsent"
            type="checkbox"
            required
            value="true"
            className="mt-1 h-4 w-4 rounded border-app-border"
          />
          <label htmlFor="gdprConsent" className="ml-2 text-sm">
            <span className="font-semibold">Obligatoire:</span>{' '}
            j'accepte la collecte et le traitement de mes donnees personnelles
            (CV, contact, activite) pour le matching et le suivi de candidatures.
            Consultez la{' '}
            <a href="/privacy" className="font-semibold text-app-brand hover:underline">
              politique de confidentialite
            </a>
            .
          </label>
        </div>
        {state.errors?.gdprConsent && (
          <p className="mt-1 text-sm text-red-600">{state.errors.gdprConsent[0]}</p>
        )}
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
      >
        Creer mon compte
      </button>

      {state.message && !state.errors && (
        <p className="text-center text-sm text-red-600">{state.message}</p>
      )}
    </form>
  )
}
