'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { logout } from '@/app/actions/auth'
import { ThemeToggle } from '@/components/theme/theme-toggle'

export function AppHeader() {
  const [count, setCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    let active = true

    async function loadUnreadCount() {
      const response = await fetch('/api/jobs/unread-count', { cache: 'no-store' })
      if (!response.ok) return
      const payload = await response.json()
      if (active) {
        setCount(typeof payload.count === 'number' ? payload.count : 0)
      }
    }

    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 30000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-app-panel/70 backdrop-blur supports-[backdrop-filter]:bg-app-panel/60 dark:bg-app-bg/55 supports-[backdrop-filter]:dark:bg-app-bg/45">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 md:px-0 md:py-4">
        <Link href="/dashboard" className="group flex items-baseline gap-2">
          <span className="font-serif text-lg font-semibold tracking-tight text-app-ink group-hover:text-app-brand">
            JobFlow
          </span>
          <span className="text-sm font-semibold text-app-muted group-hover:text-app-ink">
            Assistant
          </span>
        </Link>

        <nav className="hidden flex-wrap items-center gap-2 text-sm md:flex">
          <Link href="/dashboard" className="rounded-full px-3 py-1.5 font-semibold text-app-ink hover:bg-app-panel/80">
            Tableau de bord
          </Link>
          <Link href="/profile" className="rounded-full px-3 py-1.5 font-semibold text-app-ink hover:bg-app-panel/80">
            Profil
          </Link>
          <Link href="/jobs" className="rounded-full px-3 py-1.5 font-semibold text-app-ink hover:bg-app-panel/80">
            Offres
          </Link>
          <Link href="/applications" className="rounded-full px-3 py-1.5 font-semibold text-app-ink hover:bg-app-panel/80">
            Candidatures
          </Link>
          <Link href="/account" className="rounded-full px-3 py-1.5 font-semibold text-app-ink hover:bg-app-panel/80">
            Mon Compte
          </Link>

          <span className="chip border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Nouveau: {count}
          </span>

          <ThemeToggle />

          <form action={logout}>
            <button type="submit" className="btn-ghost px-3 py-2 text-xs">
              Deconnexion
            </button>
          </form>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <span className="chip border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {count}
          </span>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="btn-ghost px-3 py-2 text-xs"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle mobile menu"
          >
            Menu
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-app-border/80 bg-app-panel/95 px-4 py-3 backdrop-blur md:hidden">
          <nav className="grid gap-2 text-sm">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 font-semibold text-app-ink hover:bg-app-panel/80" onClick={() => setMobileMenuOpen(false)}>
              Tableau de bord
            </Link>
            <Link href="/profile" className="rounded-lg px-3 py-2 font-semibold text-app-ink hover:bg-app-panel/80" onClick={() => setMobileMenuOpen(false)}>
              Profil
            </Link>
            <Link href="/jobs" className="rounded-lg px-3 py-2 font-semibold text-app-ink hover:bg-app-panel/80" onClick={() => setMobileMenuOpen(false)}>
              Offres
            </Link>
            <Link href="/applications" className="rounded-lg px-3 py-2 font-semibold text-app-ink hover:bg-app-panel/80" onClick={() => setMobileMenuOpen(false)}>
              Candidatures
            </Link>
            <Link href="/account" className="rounded-lg px-3 py-2 font-semibold text-app-ink hover:bg-app-panel/80" onClick={() => setMobileMenuOpen(false)}>
              Mon Compte
            </Link>
            <form action={logout}>
              <button type="submit" className="btn-ghost w-full justify-center px-3 py-2 text-xs">
                Deconnexion
              </button>
            </form>
          </nav>
        </div>
      )}
    </header>
  )
}
