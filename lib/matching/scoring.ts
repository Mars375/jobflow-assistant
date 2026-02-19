export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions')
  }

  const dotProduct = a.reduce((sum, value, index) => sum + value * b[index], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0))

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dotProduct / (magnitudeA * magnitudeB)
}

export function similarityToScore(similarity: number): number {
  const clamped = Math.max(-1, Math.min(1, similarity))
  return Math.round((clamped + 1) * 50)
}

export function keywordMatchScore(cvSkills: string[], jobText: string): number {
  if (cvSkills.length === 0 || !jobText) {
    return 0
  }

  const jobTokens = new Set(jobText.toLowerCase().split(/\W+/).filter((token) => token.length > 2))
  let matches = 0
  let totalWeight = 0

  for (const skill of cvSkills) {
    const normalized = skill.trim().toLowerCase()
    if (!normalized) {
      continue
    }

    const weight = Math.min(normalized.length, 10)
    totalWeight += weight
    if (jobTokens.has(normalized)) {
      matches += weight
    }
  }

  return totalWeight > 0 ? Math.round((matches / totalWeight) * 100) : 0
}
