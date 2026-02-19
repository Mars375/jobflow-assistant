import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        md: '1.25rem',
        lg: '1.5rem',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia'],
      },
      colors: {
        app: {
          bg: 'hsl(var(--app-bg) / <alpha-value>)',
          panel: 'hsl(var(--app-panel) / <alpha-value>)',
          ink: 'hsl(var(--app-ink) / <alpha-value>)',
          muted: 'hsl(var(--app-muted) / <alpha-value>)',
          border: 'hsl(var(--app-border) / <alpha-value>)',
          brand: 'hsl(var(--app-brand) / <alpha-value>)',
          brand2: 'hsl(var(--app-brand2) / <alpha-value>)',
          danger: 'hsl(var(--app-danger) / <alpha-value>)',
        },
      },
      boxShadow: {
        panel: '0 18px 55px rgba(15, 23, 42, 0.08)',
        lift: '0 10px 30px rgba(15, 23, 42, 0.10)',
      },
    },
  },
  plugins: [],
}

export default config
