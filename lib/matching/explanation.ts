export interface MatchExplanation {
  score: number
  method: 'semantic' | 'keyword'
  matchedKeywords: string[]
  missingKeywords: string[]
  titleMatch: boolean
}

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/\W+/).filter((token) => token.length > 2))
}

export function explainMatch(
  cvSkills: string[],
  cvExperience: string,
  jobTitle: string,
  jobDescription: string
): MatchExplanation {
  const jobTokens = tokenize(`${jobTitle} ${jobDescription}`)
  const matchedKeywords = cvSkills.filter((skill) => jobTokens.has(skill.toLowerCase()))
  const missingKeywords = cvSkills.filter((skill) => !jobTokens.has(skill.toLowerCase()))

  const normalizedExperience = cvExperience.toLowerCase().trim()
  const normalizedTitle = jobTitle.toLowerCase().trim()
  const titleMatch = Boolean(normalizedExperience) &&
    (normalizedExperience.includes(normalizedTitle) || normalizedTitle.includes(normalizedExperience))

  return {
    score: 0,
    method: 'semantic',
    matchedKeywords,
    missingKeywords,
    titleMatch,
  }
}
