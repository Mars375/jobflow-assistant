export type NormalizedJob = {
  source: string
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

type FranceTravailOffer = {
  id: string
  intitule: string
  description: string
  dateCreation: string
  dateActualisation: string
  lieuTravail?: {
    libelle?: string
    codePostal?: string
  }
  entreprise?: {
    nom?: string
  }
  typeContrat?: string
  typeContratLibelle?: string
  salaire?: {
    libelle?: string
  }
  origineOffre?: {
    urlOrigine?: string
  }
}

type FranceTravailResponse = {
  resultats?: FranceTravailOffer[]
}

const API_BASE_URL = 'https://api.francetravail.io/partenaire/offresdemploi/v2'
const TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire'

type TokenResponse = {
  access_token?: string
  token_type?: string
  expires_in?: number
}

function normalizeJob(offer: FranceTravailOffer): NormalizedJob {
  return {
    source: 'france-travail-api',
    sourceId: offer.id,
    title: offer.intitule,
    company: offer.entreprise?.nom ?? null,
    location: offer.lieuTravail?.libelle ?? null,
    contractType: offer.typeContratLibelle ?? offer.typeContrat ?? null,
    description: offer.description,
    salaryText: offer.salaire?.libelle ?? null,
    publishedAt: offer.dateCreation ? new Date(offer.dateCreation) : null,
    fetchedAt: new Date(),
    url: offer.origineOffre?.urlOrigine ?? `https://candidat.francetravail.fr/offres/recherche/detail/${offer.id}`,
    metadata: {
      dateActualisation: offer.dateActualisation,
    },
  }
}

export async function fetchFranceTravailJobs(): Promise<{
  jobs: NormalizedJob[]
  malformedCount: number
}> {
  try {
    const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID
    const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET
    const scope = process.env.FRANCE_TRAVAIL_SCOPE || 'api_offresdemploiv2 o2dsoffre'

    if (!clientId || !clientSecret) {
      console.log('[API] Missing France Travail credentials')
      return { jobs: [], malformedCount: 0 }
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope,
    })

    const tokenResponse = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
      cache: 'no-store',
    })

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text()
      console.error(`[API] Token error ${tokenResponse.status}: ${body}`)
      return { jobs: [], malformedCount: 0 }
    }

    const tokenPayload = (await tokenResponse.json()) as TokenResponse
    if (!tokenPayload.access_token) {
      console.error('[API] Token missing access_token')
      return { jobs: [], malformedCount: 0 }
    }

    console.log('[API] Fetching from France Travail API...')
    
    const searchParams = new URLSearchParams({
      motsCles: 'developpeur',
      sort: '1',
      range: '0-19',
    })
    
    const response = await fetch(`${API_BASE_URL}/offres/search?${searchParams.toString()}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${tokenPayload.access_token}`,
      },
      cache: 'no-store',
    })
    
    if (!response.ok) {
      console.error(`[API] HTTP error: ${response.status} ${response.statusText}`)
      return { jobs: [], malformedCount: 0 }
    }
    
    const data: FranceTravailResponse = await response.json()
    
    if (!data.resultats || !Array.isArray(data.resultats)) {
      console.log('[API] No results found')
      return { jobs: [], malformedCount: 0 }
    }
    
    console.log(`[API] Found ${data.resultats.length} offers`)
    
    const jobs = data.resultats.map(normalizeJob)
    
    return { jobs, malformedCount: 0 }
  } catch (error) {
    console.error('[API] Error fetching France Travail jobs:', error)
    return { jobs: [], malformedCount: 0 }
  }
}
