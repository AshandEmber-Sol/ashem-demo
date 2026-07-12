import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Banner } from '@/components/Banner'

const sans = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Ash & Ember ($ASHEM) — Devnet Demo',
  description: 'Interactive devnet demo. Test network — no value, no relationship to mainnet.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <Providers>
          <Banner />
          {children}
        </Providers>
      </body>
    </html>
  )
}