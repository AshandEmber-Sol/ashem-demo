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
  const pct =
    supply != null
      ? Math.min(100, Math.max(0, ((START - supply) / (START - FLOOR)) * 100))
      : 0

  return (
    <section className="rounded-xl border border-neutral-300 p-5 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Live on-chain state</h2>
      {err && <p className="text-red-600 text-sm">Error reading mint: {err}</p>}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-neutral-500">Circulating supply</div>
          <div className="text-xl font-mono">{supply != null ? fmt(supply) : '…'}</div>
        </div>
        <div>
          <div className="text-neutral-500">Transfer fee</div>
          <div className="text-xl font-mono">{feeBps != null ? `${feeBps / 100}%` : '…'}</div>
        </div>
        <div>
          <div className="text-neutral-500">Burn floor</div>
          <div className="text-xl font-mono">{fmt(FLOOR)}</div>
        </div>
        <div>
          <div className="text-neutral-500">Distance to floor</div>
          <div className="text-xl font-mono">{distance != null ? fmt(distance) : '…'}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-3 w-full rounded-full bg-neutral-200 overflow-hidden">
          <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-neutral-500">
          {pct.toFixed(2)}% of the way from {fmt(START)} to the {fmt(FLOOR)} floor
        </div>
      </div>
    </section>
  )
}
