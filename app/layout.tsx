import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Banner } from '@/components/Banner'

export const metadata: Metadata = {
  title: 'Ash & Ember ($ASHEM) — Devnet Demo',
  description: 'Interactive devnet demo. Test network — no value, no relationship to mainnet.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <Providers>
          <Banner />
          {children}
        </Providers>
      </body>
    </html>
  )
}
