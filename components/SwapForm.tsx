'use client'
import { useState, useEffect, useRef } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction } from '@solana/web3.js'

export function SwapForm() {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const [amount, setAmount] = useState('')
  const [prepared, setPrepared] = useState<{ tx: string; out: number } | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const blockhashRef = useRef<string | null>(null)

  useEffect(() => {
    let active = true
    const fetchBh = async () => {
      try {
        const { blockhash } = await connection.getLatestBlockhash('confirmed')
        if (active) blockhashRef.current = blockhash
      } catch {}
    }
    fetchBh()
    const id = setInterval(fetchBh, 10000)
    return () => { active = false; clearInterval(id) }
  }, [connection])

  async function prepare() {
    setError(null); setResult(null); setPrepared(null)
    if (!publicKey) { setError('Connect a wallet first.'); return }
    const amt = Number(amount)
    if (!amt || amt <= 0) { setError('Enter a valid amount.'); return }
    setLoading(true); setStatus('Building swap…')
    try {
      const res = await fetch('/api/swap-tx', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wallet: publicKey.toBase58(), amount: amt }),
      })
      const data = await res.json()
      if (!res.ok) { setError((data.error || 'failed') + (data.detail ? `: ${data.detail}` : '')); return }
      setPrepared({ tx: data.tx, out: Number(data.expectedWsolOut) / 1e9 })
    } catch (e: any) { setError(String(e?.message ?? e)) }
    finally { setLoading(false); setStatus(null) }
  }

  async function confirm() {
    if (!prepared || !signTransaction) { setError('Wallet cannot sign.'); return }
    setError(null)
    const bytes = Uint8Array.from(atob(prepared.tx), (c) => c.charCodeAt(0))
    const tx = VersionedTransaction.deserialize(bytes)
    if (blockhashRef.current) tx.message.recentBlockhash = blockhashRef.current
    setLoading(true); setStatus('Approve the swap in your wallet…')
    try {
      const signed = await signTransaction(tx)
      setStatus('Sending…')
      const sig = await connection.sendRawTransaction(signed.serialize())
      setStatus('Confirming on devnet…')
      await connection.confirmTransaction(sig, 'confirmed')
      setResult({ wsolOut: prepared.out, solscan: `https://solscan.io/tx/${sig}?cluster=devnet` })
      setPrepared(null)
    } catch (e: any) { setError(String(e?.message ?? e)) }
    finally { setLoading(false); setStatus(null) }
  }

  return (
    <section className="rounded-xl border border-neutral-300 p-5 flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Swap $ASHEM → SOL (feeds the burn)</h2>
      <p className="text-sm text-neutral-500">
        Sell $ASHEM into the devnet liquidity pool. Just like a transfer, the 1.5% fee is
        withheld on the way in — that withheld $ASHEM is exactly what later gets harvested and burned.
      </p>
      <input
        value={amount} onChange={(e) => { setAmount(e.target.value); setPrepared(null) }}
        placeholder="Amount of $ASHEM to sell" inputMode="decimal"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      {!prepared ? (
        <button
          onClick={prepare} disabled={!publicKey || loading}
          className="self-start rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black disabled:opacity-40"
        >
          {loading ? 'Building…' : publicKey ? 'Get quote' : 'Connect wallet first'}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-sm">Expected out: <b>~{prepared.out.toFixed(6)} WSOL</b></span>
          <button
            onClick={confirm} disabled={loading}
            className="self-start rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black disabled:opacity-40"
          >
            {loading ? 'Swapping…' : 'Confirm swap'}
          </button>
        </div>
      )}
      {status && <p className="text-sm text-neutral-500">{status}</p>}
      {result && (
        <div className="text-sm text-green-700 flex flex-col gap-1">
          <span>Swapped. Expected ~{result.wsolOut.toFixed(6)} WSOL out.</span>
          <a className="underline" href={result.solscan} target="_blank" rel="noreferrer">View on Solscan</a>
        </div>
      )}
      {error && <p className="text-sm text-red-600 break-all">{error}</p>}
    </section>
  )
}
