'use client'

import { useEffect, useState } from 'react'

function applyTheme(next: 'light' | 'dark') {
  const root = document.documentElement
  if (next === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }
  localStorage.setItem('theme', next)
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    setMode(isDark ? 'dark' : 'light')
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-app-border bg-app-panel" />
    )
  }

  const label = mode === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        const next = mode === 'dark' ? 'light' : 'dark'
        setMode(next)
        applyTheme(next)
      }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-app-border bg-app-panel text-app-ink hover:bg-app-panel/80"
    >
      {mode === 'dark' ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v2" />
          <path d="M12 19v2" />
          <path d="M4.22 4.22l1.42 1.42" />
          <path d="M18.36 18.36l1.42 1.42" />
          <path d="M3 12h2" />
          <path d="M19 12h2" />
          <path d="M4.22 19.78l1.42-1.42" />
          <path d="M18.36 5.64l1.42-1.42" />
          <path d="M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      )}
    </button>
  )
}
