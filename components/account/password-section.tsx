'use client'

import { useFormState } from 'react-dom'
import { changePassword } from '@/app/actions/gdpr'
import { FormState } from '@/types/form'

const initialState: FormState = { message: '', errors: {} }

export function PasswordSection() {
  const [state, formAction] = useFormState(changePassword, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium">
          Mot de passe actuel
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          className="input mt-1"
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium">
          Nouveau mot de passe
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="input mt-1"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          Confirmer le nouveau mot de passe
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="input mt-1"
        />
      </div>

      <button
        type="submit"
        className="btn-primary"
      >
        Changer le mot de passe
      </button>

      {state.message && (
        <p className={`text-sm font-semibold ${state.message.includes('succès') ? 'text-emerald-700' : 'text-rose-700'}`}>
          {state.message}
        </p>
      )}
    </form>
  )
}
