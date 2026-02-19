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

export function generateJobDigestText(input: {
  firstName: string
  tiers: DigestTierData
  totalJobs: number
  hasMore: boolean
  appUrl: string
  maxJobs: number
}): string {
  const { firstName, tiers, totalJobs, hasMore, appUrl, maxJobs } = input

  const buildJobUrl = (jobId: string) => `${appUrl.replace(/\/$/, '')}/jobs/${jobId}`
  const lines: string[] = []

  lines.push(`Bonjour ${firstName},`)
  lines.push('')
  lines.push(`Voici ${totalJobs} nouvelles offres d'emploi qui correspondent a votre profil:`)
  lines.push('')

  const pushTier = (label: string, jobs: DigestJob[]) => {
    if (jobs.length === 0) return
    lines.push(`== ${label} (${jobs.length}) ==`)
    lines.push('')
    for (const job of jobs) {
      lines.push(`- ${job.title}`)
      lines.push(`  ${job.company ?? 'Entreprise non renseignee'} — ${job.location ?? 'Localisation non renseignee'}`)
      lines.push(`  Score: ${job.matchScore}%`)
      if (job.salaryText) lines.push(`  Salaire: ${job.salaryText}`)
      lines.push(`  ${buildJobUrl(job.id)}`)
      lines.push('')
    }
  }

  pushTier('EXCELLENTES CORRESPONDANCES', tiers.excellent)
  pushTier('BONNES CORRESPONDANCES', tiers.good)

  if (hasMore) {
    lines.push(`+ ${Math.max(0, totalJobs - maxJobs)} autres offres sur votre tableau de bord`)
  }

  lines.push('')
  lines.push('—')
  lines.push('JobFlow Assistant')
  lines.push(appUrl)

  return lines.join('\n')
}
