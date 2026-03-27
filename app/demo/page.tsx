'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { JobCard } from '@/components/jobs/job-card'

const MOCK_JOBS = [
  {
    id: 'demo-1',
    source: 'france-travail-api',
    title: 'Développeur Full Stack React/Node.js',
    company: 'Startup SaaS',
    location: 'Paris (75)',
    contractType: 'CDI',
    salaryText: '45-55k€',
    publishedAt: new Date().toISOString(),
    relevanceScore: 88,
    isNew: true,
  },
  {
    id: 'demo-2',
    source: 'adzuna-api',
    title: 'Ingénieur TypeScript Senior',
    company: 'Scale-up Tech',
    location: 'Lyon (69)',
    contractType: 'CDI',
    salaryText: '50-60k€',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    relevanceScore: 74,
    isNew: true,
  },
  {
    id: 'demo-3',
    source: 'france-travail-api',
    title: 'Développeur Next.js — Remote',
    company: 'Agence Digitale',
    location: 'Remote',
    contractType: 'CDD',
    salaryText: 'Selon profil',
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    relevanceScore: 61,
    isNew: false,
  },
  {
    id: 'demo-4',
    source: 'adzuna-api',
    title: 'Lead Développeur React',
    company: 'Fintech Innovante',
    location: 'Bordeaux (33)',
    contractType: 'CDI',
    salaryText: '55-65k€',
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    relevanceScore: 82,
    isNew: false,
  },
  {
    id: 'demo-5',
    source: 'france-travail-api',
    title: 'Développeur JavaScript Freelance',
    company: 'Cabinet Conseil',
    location: 'Nantes (44)',
    contractType: 'Freelance',
    salaryText: '400-500€/jour',
    publishedAt: new Date(Date.now() - 345600000).toISOString(),
    relevanceScore: 55,
    isNew: false,
  },
  {
    id: 'demo-6',
    source: 'france-travail-api',
    title: 'Ingénieur Full Stack Python/React',
    company: 'Éditeur Logiciel',
    location: 'Toulouse (31)',
    contractType: 'CDI',
    salaryText: '40-48k€',
    publishedAt: new Date(Date.now() - 432000000).toISOString(),
    relevanceScore: 68,
    isNew: false,
  },
  {
    id: 'demo-7',
    source: 'adzuna-api',
    title: 'Développeur Web Front-End',
    company: 'E-commerce Retail',
    location: 'Paris (75)',
    contractType: 'CDI',
    salaryText: '38-44k€',
    publishedAt: new Date(Date.now() - 518400000).toISOString(),
    relevanceScore: 47,
    isNew: false,
  },
  {
    id: 'demo-8',
    source: 'france-travail-api',
    title: 'Tech Lead Node.js/TypeScript',
    company: 'Healthcare Tech',
    location: 'Remote',
    contractType: 'CDI',
    salaryText: '60-70k€',
    publishedAt: new Date(Date.now() - 604800000).toISOString(),
    relevanceScore: 91,
    isNew: false,
  },
]

const KANBAN_COLUMNS = [
  {
    status: 'BROUILLON',
    label: 'Brouillon',
    color: 'text-app-muted',
    apps: [
      { company: 'Startup SaaS', role: 'Développeur Full Stack' },
      { company: 'Agence Web', role: 'Intégrateur React' },
    ],
  },
  {
    status: 'EN_ATTENTE',
    label: 'En attente',
    color: 'text-amber-600',
    apps: [
      { company: 'Scale-up Tech', role: 'Ingénieur TypeScript' },
      { company: 'Fintech', role: 'Lead Développeur' },
      { company: 'Éditeur SaaS', role: 'Dev Next.js' },
    ],
  },
  {
    status: 'ENTRETIEN',
    label: 'Entretien',
    color: 'text-blue-600',
    apps: [
      { company: 'Healthcare Tech', role: 'Tech Lead Node.js' },
    ],
  },
  {
    status: 'OFFRE',
    label: 'Offre reçue',
    color: 'text-green-600',
    apps: [
      { company: 'E-commerce', role: 'Front-End Senior' },
    ],
  },
  {
    status: 'REFUSE',
    label: 'Refusé',
    color: 'text-red-500',
    apps: [
      { company: 'Cabinet Conseil', role: 'Freelance JS' },
    ],
  },
]

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance']
const LOCATIONS = ['Paris (75)', 'Lyon (69)', 'Remote', 'Bordeaux (33)', 'Nantes (44)', 'Toulouse (31)']

type Tab = 'offres' | 'candidatures'

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('offres')
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [contractType, setContractType] = useState('')

  const filteredJobs = useMemo(() => {
    return MOCK_JOBS.filter((job) => {
      const matchesKeyword =
        keyword.trim() === '' ||
        job.title.toLowerCase().includes(keyword.toLowerCase()) ||
        (job.company ?? '').toLowerCase().includes(keyword.toLowerCase())
      const matchesLocation =
        location === '' || job.location === location
      const matchesContract =
        contractType === '' || job.contractType === contractType
      return matchesKeyword && matchesLocation && matchesContract
    })
  }, [keyword, location, contractType])

  return (
    <div className="min-h-screen">
      {/* Amber demo banner */}
      <div className="flex items-center justify-between gap-4 bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-sm text-amber-800 dark:bg-amber-400/10 dark:border-amber-300/30 dark:text-amber-200">
        <span className="font-medium">
          Mode démo — données fictives, aucun compte requis.
        </span>
        <Link href="/register" className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700 dark:text-amber-100 dark:hover:text-amber-300">
          Créer un compte →
        </Link>
      </div>

      {/* Public header */}
      <header className="sticky top-0 z-40 border-b border-app-border bg-app-panel/70 backdrop-blur supports-[backdrop-filter]:bg-app-panel/60">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 md:px-0 md:py-4">
          <Link href="/" className="font-serif text-lg font-semibold tracking-tight text-app-ink hover:text-app-brand">
            JobFlow
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/" className="rounded-full px-3 py-1.5 text-sm font-semibold text-app-ink hover:bg-app-panel/80">
              Accueil
            </Link>
            <Link href="/demo" className="rounded-full px-3 py-1.5 text-sm font-semibold text-app-brand">
              Démo
            </Link>
            <Link href="/login" className="btn-ghost text-sm">
              Se connecter
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Commencer
            </Link>
          </nav>
        </div>
      </header>

      {/* Page header */}
      <div className="container mx-auto px-4 pt-10 pb-6 md:px-0">
        <h1 className="app-title text-4xl">Démo interactive</h1>
        <p className="app-subtitle text-base">
          Explorez les fonctionnalités de JobFlow sans créer de compte.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="container mx-auto px-4 md:px-0">
        <div className="flex gap-1 border-b border-app-border">
          <button
            type="button"
            onClick={() => setActiveTab('offres')}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'offres'
                ? 'border-app-brand text-app-brand'
                : 'border-transparent text-app-muted hover:text-app-ink'
            }`}
          >
            Offres
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('candidatures')}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'candidatures'
                ? 'border-app-brand text-app-brand'
                : 'border-transparent text-app-muted hover:text-app-ink'
            }`}
          >
            Candidatures
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="container mx-auto px-4 py-8 md:px-0">
        {activeTab === 'offres' && (
          <div>
            {/* Filter bar */}
            <div className="mb-6 flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Rechercher un poste ou une entreprise..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="input max-w-sm"
              />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input w-auto"
              >
                <option value="">Toutes localisations</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="input w-auto"
              >
                <option value="">Tous contrats</option>
                {CONTRACT_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            {/* Job grid */}
            {filteredJobs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} {...job} />
                ))}
              </div>
            ) : (
              <div className="panel panel-pad text-center text-app-muted py-12">
                Aucune offre ne correspond à vos filtres.
              </div>
            )}
          </div>
        )}

        {activeTab === 'candidatures' && (
          <div>
            <p className="mb-6 text-sm text-app-muted">
              Vue Kanban en lecture seule — suivi de vos candidatures par statut.
            </p>
            {/* Kanban board */}
            <div className="flex gap-4 overflow-x-auto pb-4">
              {KANBAN_COLUMNS.map((col) => (
                <div key={col.status} className="flex-shrink-0 w-56">
                  {/* Column header */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className={`text-sm font-semibold ${col.color}`}>
                      {col.label}
                    </span>
                    <span className="chip border-app-border text-app-muted text-xs">
                      {col.apps.length}
                    </span>
                  </div>
                  {/* Cards */}
                  <div className="flex flex-col gap-2">
                    {col.apps.map((app, idx) => (
                      <div key={idx} className="panel panel-pad !p-3">
                        <p className="text-sm font-semibold text-app-ink leading-tight">
                          {app.role}
                        </p>
                        <p className="mt-1 text-xs text-app-muted">
                          {app.company}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Demo footer CTA */}
      <div className="border-t border-app-border mt-8">
        <div className="container mx-auto px-4 py-10 md:px-0 text-center">
          <p className="text-sm text-app-muted mb-4">
            Vous avez exploré la démo. Prêt à gérer vos vraies candidatures ?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-primary">
              Créer un compte gratuit
            </Link>
            <Link href="/login" className="btn-ghost">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
