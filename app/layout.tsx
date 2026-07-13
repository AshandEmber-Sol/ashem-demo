import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'

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
  title: 'Ash & Ember ($ASHEM) — Devnet Demo',
  description:
    'A live, immersive on-chain demonstration of Solana Token-2022. Every action triggers a real devnet transaction. Zero mainnet value.',
  keywords: ['Solana', 'Token-2022', 'devnet', 'ASHEM', 'Ash & Ember', 'crypto demo'],
}

export const viewport = {
  themeColor: '#ea580c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`bg-bg ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen font-sans">
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  )
}
