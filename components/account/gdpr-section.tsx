'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { exportDataJSON, exportDataCSV, deleteAccount } from '@/app/actions/gdpr'
import { FormState } from '@/types/form'

const initialState: FormState = { message: '', errors: {} }

export function GDPRSection() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [state, formAction] = useFormState(deleteAccount, initialState)

  const handleExportJSON = async () => {
    setExporting(true)
    setExportError(null)
    try {
      const data = await exportDataJSON()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jobflow-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      setExportError("Erreur lors de l'export. Veuillez reessayer.")
    } finally {
      setExporting(false)
    }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    setExportError(null)
    try {
      const data = await exportDataCSV()
      const blob = new Blob([data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jobflow-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      setExportError("Erreur lors de l'export. Veuillez reessayer.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-serif text-lg font-semibold tracking-tight">Exporter mes donnees</h3>
        <p className="mt-1 text-sm text-app-muted">
          Téléchargez une copie de toutes vos données personnelles.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            onClick={handleExportJSON}
            disabled={exporting}
            className="btn-ghost disabled:opacity-60"
          >
            Exporter en JSON
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="btn-ghost disabled:opacity-60"
          >
            Exporter en CSV
          </button>
        </div>

        {exportError && (
          <p className="mt-3 text-sm font-semibold text-rose-700">{exportError}</p>
        )}
      </div>

      <div className="border-t pt-6">
        <h3 className="font-serif text-lg font-semibold tracking-tight text-app-danger">Supprimer mon compte</h3>
        <p className="mt-1 text-sm text-app-muted">
          Cette action est irréversible. Toutes vos données seront définitivement supprimées.
        </p>

        {!showConfirmation ? (
          <button
            onClick={() => setShowConfirmation(true)}
            className="mt-3 rounded-xl border border-app-danger/40 bg-app-panel px-4 py-2 text-sm font-semibold text-app-danger hover:bg-app-panel/80 dark:hover:bg-app-panel/60"
          >
            Supprimer mon compte
          </button>
        ) : (
          <form action={formAction} className="mt-3 space-y-3">
            <p className="text-sm text-app-muted">
              Tapez <code className="rounded bg-slate-100 px-1">SUPPRIMER</code> pour confirmer :
            </p>
            <input
              name="confirmation"
              type="text"
              required
              placeholder="SUPPRIMER"
              className="input"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="btn-danger"
              >
                Confirmer la suppression
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="btn-ghost"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {state.message && (
          <p className="mt-3 text-sm font-semibold text-rose-700">{state.message}</p>
        )}
      </div>
    </div>
  )
}
