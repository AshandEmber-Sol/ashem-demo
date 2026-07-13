'use client'
import { useCallback, useEffect, useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { getMint, getTransferFeeConfig, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'

const MINT_ADDRESS = process.env.NEXT_PUBLIC_ASHEM_MINT
const MINT = MINT_ADDRESS ? new PublicKey(MINT_ADDRESS) : null
const START = 1_000_000_000
const FLOOR = 300_000_000
const DECIMALS = 9

function fmt(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}
function fmtFull(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

interface MagmaTankProps {
  onSupplyChange?: (supply: number) => void
  supplyOverride?: number | null
}

export function MagmaTank({ onSupplyChange, supplyOverride }: MagmaTankProps) {
  const { connection } = useConnection()
  const [supply, setSupply] = useState<number | null>(null)
  const [feeBps, setFeeBps] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(0)

  const load = useCallback(async () => {
    if (!MINT) { setErr('NEXT_PUBLIC_ASHEM_MINT not configured'); return }
    try {
      const mint = await getMint(connection, MINT, 'confirmed', TOKEN_2022_PROGRAM_ID)
      const s = Number(mint.supply) / 10 ** DECIMALS
      setSupply(s)
      onSupplyChange?.(s)
      const fee = getTransferFeeConfig(mint)
      setFeeBps(fee ? fee.newerTransferFee.transferFeeBasisPoints : 0)
      setErr(null)
      setLastRefresh(Date.now())
    } catch (e: any) {
      setErr(String(e?.message ?? e))
    }
  }, [connection, onSupplyChange])

  useEffect(() => {
    load()
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [load])

  // Use external override if provided (from HarvestButton eruption)
  const displaySupply = supplyOverride ?? supply

  // Fill level: 100% = full (START), 0% = at FLOOR
  const fillPct = displaySupply != null
    ? Math.min(100, Math.max(0, ((displaySupply - FLOOR) / (START - FLOOR)) * 100))
    : 100

  const burned = displaySupply != null ? START - displaySupply : 0
  const distance = displaySupply != null ? displaySupply - FLOOR : null
  const distancePct = displaySupply != null ? ((displaySupply - FLOOR) / (START - FLOOR)) * 100 : 100

  return (
    <section
      className="card-obsidian p-6 flex flex-col gap-5"
      aria-label="Live on-chain supply state"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 0 8px rgba(234,88,12,0.9)',
              animation: 'liveIndicator 2s ease-in-out infinite',
            }}
          />
          <h2 className="text-lg font-bold">Live On-Chain State</h2>
        </div>
        <button
          onClick={load}
          title="Refresh"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: 'rgba(234,88,12,0.1)',
            border: '1px solid rgba(234,88,12,0.2)',
            color: 'var(--muted)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234,88,12,0.2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(234,88,12,0.1)' }}
          aria-label="Refresh on-chain state"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </button>
      </div>

      {err && (
        <p className="text-red-400 text-xs mono px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
          RPC error: {err}
        </p>
      )}

      {/* Main layout: tank + stats */}
      <div className="flex gap-6 items-stretch">

        {/* ── Magma Tank (capsule) ── */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          {/* Flame tip */}
          <div
            className="w-4 h-5 flex-shrink-0"
            style={{
              background: 'radial-gradient(ellipse at bottom, var(--glow) 0%, var(--accent) 50%, transparent 100%)',
              clipPath: 'polygon(50% 0%, 80% 100%, 20% 100%)',
              filter: 'blur(1px)',
              animation: 'flameTip 1.5s ease-in-out infinite alternate',
            }}
          />

          {/* Glass capsule container */}
          <div
            className="relative flex-shrink-0"
            style={{ width: 64, height: 260 }}
            role="img"
            aria-label={`Magma tank fill level: ${fillPct.toFixed(1)}%`}
          >
            {/* Outer glass shell */}
            <div
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: 'linear-gradient(to right, rgba(40,25,15,0.9) 0%, rgba(20,13,8,0.8) 40%, rgba(30,18,10,0.9) 100%)',
                border: '2px solid rgba(234,88,12,0.25)',
                boxShadow: '0 0 20px rgba(234,88,12,0.15), inset 0 0 30px rgba(0,0,0,0.5)',
              }}
            />

            {/* Inner fill – lava */}
            <div
              className="absolute bottom-0 left-1 right-1 rounded-full overflow-hidden"
              style={{
                height: `${fillPct}%`,
                transition: 'height 2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '0 0 9999px 9999px',
              }}
            >
              {/* Lava gradient body */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, #7c0000 0%, #c2410c 25%, #ea580c 55%, #f97316 75%, #fbbf24 100%)',
                  animation: 'lavaShimmer 4s ease-in-out infinite',
                  backgroundSize: '100% 200%',
                }}
              />
              {/* Bubble layer */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 30% 70%, rgba(251,191,36,0.15) 0%, transparent 40%), radial-gradient(circle at 70% 30%, rgba(234,88,12,0.2) 0%, transparent 35%)',
                  animation: 'magmaBubble 6s ease-in-out infinite',
                }}
              />
              {/* Surface shimmer */}
              <div
                className="absolute top-0 left-0 right-0 h-3"
                style={{
                  background: 'linear-gradient(to bottom, rgba(251,191,36,0.5) 0%, transparent 100%)',
                  animation: 'surfaceGlow 2s ease-in-out infinite',
                }}
              />
            </div>

            {/* Floor marker line */}
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: `${((FLOOR - FLOOR) / (START - FLOOR)) * 100 + 2}%`,
                height: 2,
                background: 'rgba(239,68,68,0.6)',
                boxShadow: '0 0 6px rgba(239,68,68,0.8)',
              }}
            />

            {/* Glass highlight */}
            <div
              className="absolute top-2 bottom-2 left-2 w-2 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 100%)',
              }}
            />

            {/* Floating level indicator — left side */}
            <div
              className="absolute right-full mr-3 flex flex-row-reverse items-center gap-1.5 transition-all duration-[2000ms]"
              style={{
                bottom: `calc(${fillPct}% - 10px)`,
              }}
            >
              <div
                className="w-5 h-px"
                style={{ background: 'rgba(234,88,12,0.5)' }}
              />
              <div
                className="px-2 py-1 rounded text-xs mono font-bold whitespace-nowrap"
                style={{
                  background: 'rgba(20,12,7,0.95)',
                  border: '1px solid rgba(234,88,12,0.4)',
                  color: 'var(--glow)',
                  fontSize: '0.65rem',
                  boxShadow: '0 0 8px rgba(234,88,12,0.2)',
                }}
              >
                {distancePct.toFixed(2)}% to floor
              </div>
            </div>
          </div>

          {/* Bottom label */}
          <div className="text-center">
            <div className="text-xs text-muted font-semibold tracking-wider uppercase">Burn Floor</div>
            <div className="mono text-xs text-red-400">{fmt(FLOOR)}</div>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="flex-1 flex flex-col gap-3 justify-center">
          {/* Circulating supply – hero stat */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(14,10,7,0.8)',
              border: '1px solid rgba(234,88,12,0.2)',
            }}
          >
            <div className="text-xs text-muted uppercase tracking-wider mb-1">Circulating Supply</div>
            <div className="mono text-3xl font-bold text-ember">
              {displaySupply != null ? fmt(displaySupply) : '…'}
            </div>
            <div className="mono text-xs text-muted mt-1">
              {displaySupply != null ? fmtFull(displaySupply) : '—'} $ASHEM
            </div>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Transfer Fee', value: feeBps != null ? `${feeBps / 100}%` : '…', color: 'var(--glow)' },
              { label: 'Total Burned', value: burned > 0 ? fmt(burned) : '0', color: 'rgba(239,68,68,0.9)' },
              { label: 'Floor Target', value: fmt(FLOOR), color: 'rgba(239,68,68,0.7)' },
              { label: 'Dist. to Floor', value: distance != null ? fmt(distance) : '…', color: 'rgba(240,236,228,0.7)' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-3"
                style={{
                  background: 'rgba(10,7,5,0.7)',
                  border: '1px solid rgba(234,88,12,0.1)',
                }}
              >
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>{s.label}</div>
                <div className="mono text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Start: {fmt(START)}</span>
              <span className="text-xs" style={{ color: 'var(--accent)' }}>{(100 - fillPct).toFixed(2)}% burned</span>
            </div>
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ background: 'rgba(20,12,7,0.8)', border: '1px solid rgba(234,88,12,0.12)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-[2000ms]"
                style={{
                  width: `${100 - fillPct}%`,
                  background: 'linear-gradient(90deg, #7c0000, var(--accent), var(--glow))',
                  boxShadow: '0 0 10px rgba(234,88,12,0.6)',
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Floor: {fmt(FLOOR)}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes liveIndicator {
          0%, 100% { box-shadow: 0 0 8px rgba(234,88,12,0.9); opacity: 1; }
          50% { box-shadow: 0 0 16px rgba(234,88,12,1), 0 0 24px rgba(234,88,12,0.5); opacity: 0.7; }
        }
        @keyframes lavaShimmer {
          0% { background-position: 0% 100%; }
          50% { background-position: 0% 30%; }
          100% { background-position: 0% 100%; }
        }
        @keyframes surfaceGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes flameTip {
          0% { transform: scaleY(0.8) translateY(2px); opacity: 0.7; }
          100% { transform: scaleY(1.1) translateY(-1px); opacity: 1; }
        }
      `}</style>
    </section>
  )
}
