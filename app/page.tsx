'use client'
import dynamic from 'next/dynamic'
import { MintStats } from '@/components/MintStats'
import { ClaimButton } from '@/components/ClaimButton'
import { TransferForm } from '@/components/TransferForm'

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false }
)

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Ash &amp; Ember — $ASHEM</h1>
        <p className="text-neutral-500">
          A live, on-chain demo on Solana devnet. Every action here is a real transaction —
          nothing is simulated. This interface has no smart contract of its own; it only calls
          Token-2022&apos;s native instructions directly.
        </p>
      </header>
      <div><WalletMultiButton /></div>
      <MintStats />
      <ClaimButton />
      <TransferForm />
    </main>
  )
}
