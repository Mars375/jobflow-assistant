import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Serif } from 'next/font/google'
import './globals.css'

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
})

const serif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'JobFlow Assistant',
  description:
    'Assistant intelligent de recherche d\'emploi — automatisez votre pipeline de candidatures.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var d=(t==='dark')||(t==null&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');r.style.colorScheme='dark';}else{r.classList.remove('dark');r.style.colorScheme='light';}}catch(e){}})();",
          }}
        />
      </head>
      <body className={`${sans.variable} ${serif.variable} font-sans`}>{children}</body>
    </html>
  )
}
