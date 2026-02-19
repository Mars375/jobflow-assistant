import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { uploadCvFromForm } from '@/app/actions/cv'
import { getProfileSummary } from '@/app/actions/profile'
import { AppHeader } from '@/components/layout/app-header'
import { ProfileEditor } from '@/components/profile/profile-editor'
import { FilePicker } from '@/components/ui/file-picker'

export default async function ProfilePage() {
  const session = await verifySession()
  if (!session) {
    redirect('/login')
  }

  const summary = await getProfileSummary()

  return (
    <main className="app-shell">
      <AppHeader />
      <div className="app-page space-y-6">
        <h1 className="app-title">Profil CV</h1>
        <p className="app-subtitle">
          Importez votre CV (PDF/DOCX), consultez le resume d'extraction puis corrigez les champs.
        </p>

        <form action={uploadCvFromForm} className="panel panel-pad">
          <FilePicker
            name="cv"
            accept=".pdf,.docx,application/pdf"
            required
            label="Upload CV"
            help="PDF ou DOCX, max 5 Mo"
          />

          <div className="mt-4 flex items-center justify-end">
            <button type="submit" className="btn-primary">
              Importer et analyser
            </button>
          </div>
        </form>

        <ProfileEditor
          summary={
            summary ?? {
              skills: [],
              experience: [],
              education: [],
              contact: {},
              warnings: ['Aucune extraction disponible. Importez un CV pour commencer.'],
              parsedAt: null,
            }
          }
        />
      </div>
    </main>
  )
}
