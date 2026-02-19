'use client'

import { useFormState } from 'react-dom'
import { login } from '@/app/actions/auth'
import { FormState } from '@/types/form'

const initialState: FormState = { message: '', errors: {} }

export function LoginForm() {
  const [state, formAction] = useFormState(login, initialState)

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
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
          autoComplete="current-password"
          className="input mt-1"
        />
        {state.errors?.password && (
          <p className="mt-1 text-sm text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="rememberMe"
          name="rememberMe"
          type="checkbox"
          value="true"
          className="h-4 w-4 rounded border-app-border"
        />
        <label htmlFor="rememberMe" className="text-sm text-app-muted">
          Se souvenir de moi (30 jours)
        </label>
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
      >
        Se connecter
      </button>

      {state.message && (
        <p className="text-center text-sm text-red-600">{state.message}</p>
      )}
    </form>
  )
}
