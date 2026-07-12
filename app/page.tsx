'use client'
import dynamic from 'next/dynamic'
import { MintStats } from '@/components/MintStats'
import { ClaimButton } from '@/components/ClaimButton'
import { TransferForm } from '@/components/TransferForm'
import { HarvestButton } from '@/components/HarvestButton'

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <img
            src="/mascot.png"
            alt="Ash & Ember mascot"
            className="h-14 w-14 rounded-full ring-2 ring-accent/40"
            style={{ boxShadow: '0 0 28px -4px var(--accent)' }}
          />
          <h1 className="text-3xl font-bold tracking-tight">
            Ash &amp; Ember <span className="text-ember">$ASHEM</span>
          </h1>
        </div>
        <p className="text-muted leading-relaxed">
          A live, on-chain demo on Solana devnet. Every action here is a real transaction —
          nothing is simulated. This interface has no smart contract of its own; it only calls
          Token-2022&apos;s native instructions directly.
        </p>
      </header>
      <div><WalletMultiButton /></div>
      <MintStats />
      <ClaimButton />
      <TransferForm />
      <HarvestButton />
    </main>
  )
}