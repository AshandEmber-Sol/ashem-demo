import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Footer } from '@/components/Footer'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

// The sticky TestnetBanner + Navbar used to live here (global). They moved to /demo
// only — the mainnet landing (/) has its own topbar and must not show a testnet banner.
// Footer stays global (landing, /demo, /terms, /risk all use it).

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jb',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Ash & Ember · $ASHEM',
  description:
    "A Solana Token-2022 memecoin whose every mechanic is verifiable on-chain. We don't ask for trust — we publish proof.",
  keywords: ['Solana', 'Token-2022', 'ASHEM', 'Ash & Ember', 'memecoin', 'on-chain'],
}

export const viewport = {
  themeColor: '#ea580c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`bg-bg ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen font-sans">
        <Providers>
          {children}
          <Footer />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
