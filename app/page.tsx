import type { Metadata } from 'next'
import TokenProof from '@/components/landing/TokenProof'

// New home = the mainnet landing. The devnet demo now lives at /demo.

export const metadata: Metadata = {
  title: 'Ash & Ember ($ASHEM) — verifiable on-chain',
  description:
    "A Solana Token-2022 memecoin whose every mechanic — supply, fee, revoked authorities, the burn — is a record you can check on-chain. We don't ask for trust — we publish proof.",
}

export default function Page() {
  return <TokenProof />
}
