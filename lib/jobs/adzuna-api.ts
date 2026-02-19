const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/fr'

export type AdzunaJob = {
  source: 'adzuna-api'
  sourceId: string
  title: string
  company: string | null
  location: string | null
  contractType: string | null
  description: string | null
  salaryText: string | null
  publishedAt: Date | null
  fetchedAt: Date
  url: string | null
  metadata: Record<string, unknown>
}

type AdzunaResponse = {
  results?: Array<{
    id: string
    title: string
    description: string
    company?: {
      display_name?: string
    }
    location?: {
      display_name?: string
    }
    contract_type?: string
    salary_min?: number
    salary_max?: number
    salary_is_predicted?: string
    redirect_url?: string
    created?: string
  }>
}

function normalizeContractType(type?: string): string | null {
  if (!type) return null
  const lowered = type.toLowerCase()
  if (lowered.includes('permanent')) return 'CDI'
  if (lowered.includes('contract')) return 'CDD'
  if (lowered.includes('temporary')) return 'Intérim'
  if (lowered.includes('apprenticeship')) return 'Alternance'
  if (lowered.includes('internship')) return 'Stage'
  return type
}

function formatSalary(min?: number, max?: number, isPredicted?: string): string | null {
  if (!min && !max) return null
  const parts: string[] = []
  if (min) parts.push(`${min.toLocaleString()}€`)
  if (max) parts.push(`${max.toLocaleString()}€`)
  let result = parts.join(' - ')
  if (isPredicted === '1') {
    result += ' (estimé)'
  }
  return result
}

export async function fetchAdzunaJobs(): Promise<{
  jobs: AdzunaJob[]
  malformedCount: number
}> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  
  if (!appId || !appKey) {
    console.log('[Adzuna] Missing API credentials')
    return { jobs: [], malformedCount: 0 }
  }
  
  try {
    console.log('[Adzuna] Fetching jobs...')
    
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      what: 'developpeur software engineer',
      max_days_old: '30',
      results_per_page: '20',
    })
    
    const response = await fetch(`${ADZUNA_BASE_URL}/search/1?${params.toString()}`, {
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.error(`[Adzuna] HTTP error: ${response.status}`)
      return { jobs: [], malformedCount: 0 }
    }
    
    const data: AdzunaResponse = await response.json()
    
    if (!data.results || !Array.isArray(data.results)) {
      console.log('[Adzuna] No results')
      return { jobs: [], malformedCount: 0 }
    }
    
    console.log(`[Adzuna] Found ${data.results.length} jobs`)
    
    const jobs: AdzunaJob[] = data.results.map((job) => ({
      source: 'adzuna-api',
      sourceId: `adzuna-${job.id}`,
      title: job.title,
      company: job.company?.display_name ?? null,
      location: job.location?.display_name ?? null,
      contractType: normalizeContractType(job.contract_type),
      description: job.description,
      salaryText: formatSalary(job.salary_min, job.salary_max, job.salary_is_predicted),
      publishedAt: job.created ? new Date(job.created) : null,
      fetchedAt: new Date(),
      url: job.redirect_url ?? null,
      metadata: {
        originalId: job.id,
      },
    }))
    
    return { jobs, malformedCount: 0 }
  } catch (error) {
    console.error('[Adzuna] Error:', error)
    return { jobs: [], malformedCount: 0 }
  }
}
