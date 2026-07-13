'use client'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

export function ClaimButton() {
  const { publicKey } = useWallet()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  async function claim() {
    if (!publicKey) return
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch('/api/dispense', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'dispense failed')
      else setResult(data)
    } catch (e: any) {
      setError(String(e?.message ?? e))
    } finally {
      setLoading(false)
    }
  }

  const locked = !publicKey

  return (
    <section className="card-obsidian p-6 flex flex-col gap-5 relative overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(234,88,12,0.15)',
            border: '1px solid rgba(234,88,12,0.25)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold">Get Test Funds</h2>
          <p className="text-xs text-muted">Free devnet SOL + $ASHEM to try the demo</p>
        </div>
      </div>

      {/* Content row: mascot + description + button */}
      <div className="flex items-start gap-5">

        {/* Mascot with dialog bubble */}
        <div
          className="relative flex-shrink-0 cursor-pointer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onFocus={() => setShowTooltip(true)}
          onBlur={() => setShowTooltip(false)}
          tabIndex={0}
          role="img"
          aria-label="Ash mascot — hover for a tip"
        >
          <img
            src="/mascot-round.png"
            alt="Round Ash mascot with orange lava cracks"
            className="h-20 w-20 mascot-float crack-glow"
            style={{
              filter: 'drop-shadow(0 0 14px rgba(234,88,12,0.55))',
              transition: 'transform 0.2s ease',
              transform: showTooltip ? 'scale(1.08)' : 'scale(1)',
            }}
          />

          {/* Comic speech bubble */}
          <div
            className="absolute -top-2 left-[calc(100%+8px)] w-max max-w-[200px]"
            style={{
              opacity: showTooltip ? 1 : 0,
              transform: showTooltip ? 'translateX(0) scale(1)' : 'translateX(-8px) scale(0.95)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {/* Bubble */}
            <div
              className="rounded-xl px-3 py-2.5 text-xs font-semibold leading-relaxed"
              style={{
                background: 'linear-gradient(135deg, #1a0f0a, #120c08)',
                border: '1px solid rgba(234,88,12,0.5)',
                color: 'var(--text)',
                boxShadow: '0 0 16px rgba(234,88,12,0.3), 0 4px 16px rgba(0,0,0,0.6)',
              }}
            >
              {/* Tail arrow */}
              <div
                className="absolute top-3 -left-2.5"
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: '10px solid rgba(234,88,12,0.5)',
                }}
              />
              <div
                className="absolute top-3 -left-2"
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: '10px solid #1a0f0a',
                }}
              />
              <span className="text-ember">¡Claim some SOL &amp; $ASHEM</span>
              {' '}before burning the world!
            </div>
          </div>
        </div>

        {/* Right: description + button */}
        <div className="flex-1 flex flex-col gap-3">
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,236,228,0.75)' }}>
            Claim devnet SOL and $ASHEM test tokens to try the demo. These are{' '}
            <span className="text-red-400 font-semibold">zero-value devnet tokens</span> — claiming them creates
            no allocation or expectation for mainnet.
          </p>

          <button
            onClick={claim}
            disabled={locked || loading}
            className="btn-fire self-start rounded-xl px-5 py-2.5 text-sm relative overflow-hidden"
          >
            {loading && (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Dispensing…
              </span>
            )}
            {!loading && (locked ? 'Connect Wallet First' : 'Claim Test Funds')}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
          }}
        >
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="text-sm flex flex-col gap-1">
            <span style={{ color: 'rgba(134,239,172,0.9)' }}>
              Sent <strong className="mono">{result.sol}</strong> SOL +{' '}
              <strong className="mono">{result.ashem}</strong> $ASHEM
              <span className="text-muted text-xs"> (after 1.5% fee)</span>
            </span>
            <a
              className="text-accent text-xs underline underline-offset-2"
              href={result.solscan}
              target="_blank"
              rel="noreferrer"
            >
              View on Solscan &rarr;
            </a>
          </div>
        </div>
      )}
      {error && (
        <p className="text-red-400 text-sm mono px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
          {error}
        </p>
      )}

      {/* Locked overlay */}
      {locked && (
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(8,6,4,0.55)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div className="flex flex-col items-center gap-2 text-center px-6">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-sm text-muted font-semibold">Connect wallet to unlock the furnace</span>
          </div>
        </div>
      )}
    </section>
  )
}
