import { Html } from '@react-email/html'
import { Button } from '@react-email/button'

type DigestJob = {
  id: string
  title: string
  company: string | null
  location: string | null
  salaryText: string | null
  matchScore: number
}

type DigestTierData = {
  excellent: DigestJob[]
  good: DigestJob[]
}

export interface JobDigestEmailProps {
  firstName: string
  tiers: DigestTierData
  totalJobs: number
  hasMore: boolean
  appUrl: string
}

function jobUrl(appUrl: string, jobId: string): string {
  return `${appUrl.replace(/\/$/, '')}/jobs/${jobId}`
}

function TierSection(props: { title: string; jobs: DigestJob[]; appUrl: string }) {
  const { title, jobs, appUrl } = props
  if (jobs.length === 0) {
    return null
  }

  return (
    <div style={{ marginTop: '18px' }}>
      <div style={{ fontWeight: 700, background: '#f3f4f6', borderRadius: '10px', padding: '10px 12px' }}>
        {title} ({jobs.length})
      </div>

      {jobs.map((job) => (
        <div
          key={job.id}
          style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px', marginTop: '12px' }}
        >
          <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>{job.title}</div>
          <div style={{ marginTop: '6px', color: '#374151' }}>
            {job.company ?? 'Entreprise non renseignee'} — {job.location ?? 'Localisation non renseignee'}
          </div>
          <div style={{ marginTop: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                background: '#111827',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {job.matchScore}%
            </span>
          </div>

          {job.salaryText ? (
            <div style={{ marginTop: '6px', color: '#4b5563' }}>Salaire: {job.salaryText}</div>
          ) : null}

          <div style={{ marginTop: '10px' }}>
            <Button
              href={jobUrl(appUrl, job.id)}
              style={{
                display: 'inline-block',
                backgroundColor: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '10px',
                padding: '10px 14px',
                fontWeight: 700,
              }}
            >
              Voir l'offre
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function JobDigestEmail({ firstName, tiers, appUrl }: JobDigestEmailProps) {
  return (
    <Html lang="fr">
      <div
        style={{
          fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '20px',
        }}
      >
        <div style={{ background: '#111827', color: 'white', borderRadius: '14px', padding: '18px 18px 16px' }}>
          <div style={{ fontSize: '20px', fontWeight: 900 }}>Vos opportunites du jour</div>
          <div style={{ marginTop: '6px', color: '#d1d5db' }}>Bonjour {firstName},</div>
        </div>

        <TierSection title="Excellentes correspondances" jobs={tiers.excellent} appUrl={appUrl} />
        <TierSection title="Bonnes correspondances" jobs={tiers.good} appUrl={appUrl} />

        <div style={{ marginTop: '22px', color: '#6b7280', fontSize: '13px' }}>
          <a href={`${appUrl.replace(/\/$/, '')}/account`} style={{ color: '#2563eb', textDecoration: 'none' }}>
            Gerer vos preferences
          </a>
        </div>
      </div>
    </Html>
  )
}
