import type { Metadata } from 'next'

// Scopes the devnet-demo title/description to /demo (the old root metadata).

export const metadata: Metadata = {
  title: 'Ash & Ember ($ASHEM) — Devnet Demo',
  description:
    'A live, immersive on-chain demonstration of Solana Token-2022. Every action triggers a real devnet transaction. Zero mainnet value.',
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}
