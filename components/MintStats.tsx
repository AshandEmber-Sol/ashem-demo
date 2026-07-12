'use client'
import { useCallback, useEffect, useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { getMint, getTransferFeeConfig, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'

const MINT = new PublicKey(process.env.NEXT_PUBLIC_ASHEM_MINT!)
const START = 1_000_000_000
const FLOOR = 300_000_000
const DECIMALS = 9

function fmt(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function MintStats() {
  const { connection } = useConnection()
  const [supply, setSupply] = useState<number | null>(null)
  const [feeBps, setFeeBps] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const mint = await getMint(connection, MINT, 'confirmed', TOKEN_2022_PROGRAM_ID)
      setSupply(Number(mint.supply) / 10 ** DECIMALS)
      const fee = getTransferFeeConfig(mint)
      setFeeBps(fee ? fee.newerTransferFee.transferFeeBasisPoints : 0)
      setErr(null)
    } catch (e: any) {
      setErr(String(e?.message ?? e))
    }
  }, [connection])

  useEffect(() => {
    load()
    const id = setInterval(load, 15000)
    return () => clearInterval(id)
  }, [load])

  const distance = supply != null ? supply - FLOOR : null
  const pct = supply != null ? Math.min(100, Math.max(0, ((START - supply) / (START - FLOOR)) * 100)) : 0

  const Stat = ({ label, value, ember }: { label: string; value: string; ember?: boolean }) => (
    <div>
      <div className="text-muted text-xs uppercase tracking-wider">{label}</div>
      <div className={`mono text-2xl ${ember ? 'text-ember' : ''}`}>{value}</div>
    </div>
  )

  return (
    <section className="rounded-2xl border border-edge bg-surface p-6 flex flex-col gap-5 card-glow">
      <h2 className="text-lg font-semibold">Live on-chain state</h2>
      {err && <p className="text-red-400 text-sm">Error reading mint: {err}</p>}
      <div className="grid grid-cols-2 gap-5">
        <Stat label="Circulating supply" value={supply != null ? fmt(supply) : '…'} ember />
        <Stat label="Transfer fee" value={feeBps != null ? `${feeBps / 100}%` : '…'} />
        <Stat label="Burn floor" value={fmt(FLOOR)} />
        <Stat label="Distance to floor" value={distance != null ? fmt(distance) : '…'} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-2.5 w-full rounded-full bg-edge overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--glow))',
              boxShadow: '0 0 12px rgba(234, 88, 12, 0.7)',
            }}
          />
        </div>
        <div className="text-xs text-muted">
          {pct.toFixed(2)}% of the way from {fmt(START)} to the {fmt(FLOOR)} floor
        </div>
      </div>
    </section>
  )
}