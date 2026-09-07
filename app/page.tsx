import type { Metadata } from 'next'
import TokenProof from '@/components/landing/TokenProof'
import { getTokenSupply, getMintInfo } from '@/lib/ashem/solana'
import { MINT, INITIAL_SUPPLY } from '@/lib/ashem/config'

// New home = the mainnet landing. The devnet demo now lives at /demo.

export const metadata: Metadata = {
  title: 'Ash & Ember ($ASHEM) — verifiable on-chain',
  description:
    "A Solana Token-2022 memecoin whose every mechanic — supply, fee, revoked authorities, the burn — is a record you can check on-chain. We don't ask for trust — we publish proof.",
}

// Server-render the live on-chain supply into the HTML so crawlers and social cards see
// the real, post-burn numbers instead of a placeholder. Revalidate every 30s to keep it
// fresh while throttling the RPC read — same budget idea as the /api/mainnet-state cache.
export const revalidate = 30

async function getInitialState() {
  try {
    const [supply, mint] = await Promise.all([getTokenSupply(MINT), getMintInfo(MINT)])
    return {
      supply: supply.ui,
      burned: INITIAL_SUPPLY - supply.ui,
      mintAuthority: mint.mintAuthority,
      freezeAuthority: mint.freezeAuthority,
      feeAuthority: mint.transferFee?.transferFeeConfigAuthority ?? null,
      ts: Date.now(),
    }
  } catch {
    return null
  }
}

export default async function Page() {
  const initial = await getInitialState()
  return <TokenProof initial={initial} />
}