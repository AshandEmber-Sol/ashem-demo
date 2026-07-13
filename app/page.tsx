'use client'
import { useState, useCallback } from 'react'
import { RiskDisclaimer } from '@/components/RiskDisclaimer'
import { HeroBanner } from '@/components/HeroBanner'
import { MagmaTank } from '@/components/MagmaTank'
import { MascotCard } from '@/components/MascotCard'
import { ClaimButton } from '@/components/ClaimButton'
import { TransferForm } from '@/components/TransferForm'
import { HarvestButton } from '@/components/HarvestButton'

export default function Home() {
  const [acknowledged, setAcknowledged] = useState(false)
  const [supplyOverride, setSupplyOverride] = useState<number | null>(null)
  const [eruptionKey, setEruptionKey] = useState(0)

  // When harvest succeeds, trigger a visual decrease to simulate burning
  const handleErupt = useCallback(() => {
    setEruptionKey((k) => k + 1)
    // MagmaTank will re-fetch from chain automatically, but we flash the panel
  }, [])

  return (
    <>
      {/* Risk Disclaimer gate */}
      {!acknowledged && <RiskDisclaimer onAcknowledge={() => setAcknowledged(true)} />}

      {/* Main dApp content */}
      <main
        className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 flex flex-col gap-6"
        style={{
          paddingTop: '6rem', // clear fixed navbar
          opacity: acknowledged ? 1 : 0.15,
          filter: acknowledged ? 'none' : 'blur(4px)',
          transition: 'opacity 0.8s ease, filter 0.8s ease',
          pointerEvents: acknowledged ? 'auto' : 'none',
        }}
      >
        {/* ── Hero Banner ── */}
        <HeroBanner />

        {/* ── Section: Live On-Chain State (Magma Tank) ── */}
        <MagmaTank
          key={eruptionKey}
          onSupplyChange={setSupplyOverride}
          supplyOverride={null}
        />

        {/* ── Section divider ── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(234,88,12,0.15)' }} />
          <span className="text-xs text-muted font-semibold tracking-widest uppercase">Transaction Zone</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(234,88,12,0.15)' }} />
        </div>

        {/* ── Meet Ash character card ── */}
        <MascotCard />

        {/* ── Section: Get Test Funds ── */}
        <ClaimButton />

        {/* ── Section: Send $ASHEM ── */}
        <TransferForm />

        {/* ── Section divider ── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(234,88,12,0.15)' }} />
          <span className="text-xs text-muted font-semibold tracking-widest uppercase">Burn Engine</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(234,88,12,0.15)' }} />
        </div>

        {/* ── Section: Harvest & Burn ── */}
        <HarvestButton onErupt={handleErupt} />

        {/* Footer */}
        <footer className="pt-4 text-center flex flex-col gap-2">
          <div
            className="h-px w-full"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(234,88,12,0.2), transparent)' }}
          />
          <p className="text-xs text-muted leading-relaxed">
            Ash &amp; Ember ($ASHEM) is a Solana Devnet demonstration of the Token-2022 standard.
            All tokens have zero monetary value and no relationship to any mainnet asset.
          </p>
          <p className="mono text-xs" style={{ color: 'rgba(234,88,12,0.4)' }}>
            Built with Token-2022 · Solana Devnet · GitHub Actions
          </p>
        </footer>
      </main>
    </>
  )
}
