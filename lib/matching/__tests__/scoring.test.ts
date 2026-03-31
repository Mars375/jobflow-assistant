import { describe, it, expect } from 'vitest'
import { cosineSimilarity, similarityToScore, keywordMatchScore } from '../scoring'

describe('cosineSimilarity', () => {
  it('returns 1 for identical non-zero vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0)
  })

  it('returns 0 when first vector is all zeros', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0)
  })

  it('returns 0 when second vector is all zeros', () => {
    expect(cosineSimilarity([1, 2, 3], [0, 0, 0])).toBe(0)
  })

  it('returns 0 when both vectors are zero', () => {
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0)
  })

  it('throws when vectors have different dimensions', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(
      'Vectors must have same dimensions'
    )
  })

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1)
  })

  it('handles single-element vectors', () => {
    expect(cosineSimilarity([5], [5])).toBeCloseTo(1)
  })
})

describe('similarityToScore', () => {
  it('maps similarity 1.0 to score 100', () => {
    expect(similarityToScore(1.0)).toBe(100)
  })

  it('maps similarity -1.0 to score 0', () => {
    expect(similarityToScore(-1.0)).toBe(0)
  })

  it('maps similarity 0 to score 50', () => {
    expect(similarityToScore(0)).toBe(50)
  })

  it('maps similarity 0.5 to score 75', () => {
    expect(similarityToScore(0.5)).toBe(75)
  })

  it('maps similarity -0.5 to score 25', () => {
    expect(similarityToScore(-0.5)).toBe(25)
  })

  it('clamps values above 1', () => {
    expect(similarityToScore(2)).toBe(100)
  })

  it('clamps values below -1', () => {
    expect(similarityToScore(-2)).toBe(0)
  })
})

describe('keywordMatchScore', () => {
  it('returns 100 when all skills match the job text', () => {
    const score = keywordMatchScore(['python', 'react'], 'We need python and react skills')
    expect(score).toBe(100)
  })

  it('returns 0 when no skills match the job text', () => {
    const score = keywordMatchScore(['cobol', 'fortran'], 'We need python and react skills')
    expect(score).toBe(0)
  })

  it('returns 0 when cvSkills is empty', () => {
    expect(keywordMatchScore([], 'We need python and react skills')).toBe(0)
  })

  it('returns 0 when jobText is empty string', () => {
    expect(keywordMatchScore(['python', 'react'], '')).toBe(0)
  })

  it('is case-insensitive when matching skills', () => {
    const score = keywordMatchScore(['Python', 'REACT'], 'we need python and react developers')
    expect(score).toBe(100)
  })

  it('gives partial score when only some skills match', () => {
    // 'python' matches, 'cobol' does not
    const score = keywordMatchScore(['python', 'cobol'], 'we need python developers')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(100)
  })

  it('ignores tokens of 2 characters or fewer in job text', () => {
    // 'js' is 2 chars and gets filtered out of jobTokens
    const score = keywordMatchScore(['js'], 'we need js developers')
    expect(score).toBe(0)
  })

  it('handles skills that are blank or whitespace only', () => {
    // blank skills are skipped entirely; only 'python' contributes
    const score = keywordMatchScore(['  ', 'python'], 'we need python developers')
    expect(score).toBe(100)
  })

  it('weights longer skill names more heavily', () => {
    // 'javascript' (10 chars) outweighs 'sql' (3 chars)
    // only 'javascript' matches: weight 10 out of (10+3)=13
    const score = keywordMatchScore(['javascript', 'sql'], 'strong javascript developer needed')
    expect(score).toBe(Math.round((10 / 13) * 100))
  })
})
