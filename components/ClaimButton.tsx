'use client'
import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

export function ClaimButton() {
  const { publicKey } = useWallet()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <section className="rounded-xl border border-neutral-300 p-5 flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Get test funds</h2>
      <p className="text-sm text-neutral-500">
        Claim a small amount of devnet SOL and $ASHEM to try the demo. These are devnet tokens
        with zero value. Claiming them creates no allocation, whitelist, or expectation for mainnet.
      </p>
      <button
        onClick={claim}
        disabled={!publicKey || loading}
        className="self-start rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black disabled:opacity-40"
      >
        {loading ? 'Dispensing…' : publicKey ? 'Claim test funds' : 'Connect wallet first'}
      </button>
      {result && (
        <p className="text-sm text-green-700">
          Sent {result.sol} SOL + {result.ashem} $ASHEM (minus the 1.5% transfer fee).{' '}
          <a className="underline" href={result.solscan} target="_blank" rel="noreferrer">View on Solscan</a>
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  )
}
