'use client'

import { useFormState } from 'react-dom'
import { saveProfile, type ProfileSummary } from '@/app/actions/profile'
import { FormState } from '@/types/form'

const initialState: FormState = { message: '', errors: {} }

type ProfileEditorProps = {
  summary: ProfileSummary
}

function joinList(items: unknown[]): string {
  return items
    .map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object') {
        const values = Object.values(item as Record<string, string>).filter(Boolean)
        return values.join(' - ')
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

export function ProfileEditor({ summary }: ProfileEditorProps) {
  const [state, formAction] = useFormState(saveProfile, initialState)

  return (
    <div className="space-y-6">
      <section className="panel panel-pad border-amber-200 bg-amber-50/60 dark:border-amber-300/30 dark:bg-amber-400/10">
        <h2 className="font-serif text-lg font-semibold tracking-tight">Resume d'extraction</h2>
        <p className="mt-1 text-sm text-app-muted">
          Verifiez les champs detectes avant edition. Les avertissements ne bloquent pas la sauvegarde.
        </p>

        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-app-muted">
          <li>Skills detectees: {summary.skills.length}</li>
          <li>Experience detectee: {summary.experience.length}</li>
          <li>Education detectee: {summary.education.length}</li>
          <li>
            Derniere extraction: {summary.parsedAt ? new Date(summary.parsedAt).toLocaleString('fr-FR') : 'N/A'}
          </li>
        </ul>

        {summary.warnings.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-app-panel/70 p-3 text-sm text-amber-900 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100">
            <p className="font-semibold">Points a verifier:</p>
            <ul className="mt-1 list-disc pl-5">
              {summary.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <form action={formAction} className="panel panel-pad space-y-4">
        <h2 className="font-serif text-lg font-semibold tracking-tight">Edition manuelle</h2>

        <label className="block text-sm font-semibold text-app-ink" htmlFor="skills">
          skills (une ligne par competence)
        </label>
        <textarea
          id="skills"
          name="skills"
          defaultValue={joinList(summary.skills)}
          rows={5}
          className="input"
        />

        <label className="block text-sm font-semibold text-app-ink" htmlFor="experience">
          experience (une ligne par experience)
        </label>
        <textarea
          id="experience"
          name="experience"
          defaultValue={joinList(summary.experience)}
          rows={5}
          className="input"
        />

        <label className="block text-sm font-semibold text-app-ink" htmlFor="education">
          education (une ligne par formation)
        </label>
        <textarea
          id="education"
          name="education"
          defaultValue={joinList(summary.education)}
          rows={5}
          className="input"
        />

        <div className="grid gap-3 md:grid-cols-3">
          <input
            name="contactEmail"
            defaultValue={summary.contact.email ?? ''}
            placeholder="Email"
            className="input"
          />
          <input
            name="contactPhone"
            defaultValue={summary.contact.phone ?? ''}
            placeholder="Telephone"
            className="input"
          />
          <input
            name="contactLocation"
            defaultValue={summary.contact.location ?? ''}
            placeholder="Ville"
            className="input"
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
        >
          Sauvegarder le profil
        </button>

        {state.message && (
          <p className="text-sm font-semibold text-app-brand">{state.message}</p>
        )}
      </form>
    </div>
  )
}
