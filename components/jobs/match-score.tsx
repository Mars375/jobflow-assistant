type MatchScoreProps = {
  score: number
  className?: string
}

function scoreClasses(score: number): string {
  if (score >= 80) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100'
  }
  if (score >= 50) {
    return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100'
  }
  return 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-100'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent match'
  if (score >= 50) return 'Good match'
  if (score >= 30) return 'Partial match'
  return 'Low match'
}

export function MatchScore({ score, className }: MatchScoreProps) {
  return (
    <span
      title={scoreLabel(score)}
      className={`chip ${scoreClasses(score)} ${className ?? ''}`}
    >
      {score}%
    </span>
  )
}
