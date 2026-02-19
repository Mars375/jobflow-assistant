type JobInput = {
  title: string
  description: string | null
  location: string | null
  contractType: string | null
}

type ProfileInput = {
  skills: string[]
  experience: Array<Record<string, string>>
  education: Array<Record<string, string>>
  contact: Record<string, string>
}

function scoreKeywordCoverage(text: string, terms: string[]): number {
  if (terms.length === 0) return 0
  const normalized = text.toLowerCase()
  const matches = terms.filter((term) => normalized.includes(term.toLowerCase())).length
  return Math.round((matches / terms.length) * 60)
}

export function scoreJobRelevance(
  job: JobInput,
  profile: ProfileInput | null,
  keywordFilter?: string
): number {
  const haystack = `${job.title} ${job.description ?? ''}`.trim()
  let score = 0

  if (profile) {
    score += scoreKeywordCoverage(haystack, profile.skills)
    if (profile.experience.length > 0) score += 15
    if (profile.education.length > 0) score += 10
    if (profile.contact?.location && job.location) {
      if (job.location.toLowerCase().includes(profile.contact.location.toLowerCase())) {
        score += 10
      }
    }
  }

  if (keywordFilter && haystack.toLowerCase().includes(keywordFilter.toLowerCase())) {
    score += 20
  }

  return Math.max(0, Math.min(score, 100))
}
