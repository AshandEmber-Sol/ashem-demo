'use client'
import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getMint,
  getTransferFeeConfig,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token'

const MINT = new PublicKey(process.env.NEXT_PUBLIC_ASHEM_MINT!)
const DECIMALS = 9

export function TransferForm() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function transfer() {
    setError(null); setResult(null)
    if (!publicKey) { setError('Connect a wallet first.'); return }
    let dest: PublicKey
    try { dest = new PublicKey(to.trim()) } catch { setError('Invalid destination address.'); return }
    const uiAmount = Number(amount)
    if (!uiAmount || uiAmount <= 0) { setError('Enter a valid amount.'); return }
    const raw = BigInt(Math.floor(uiAmount * 10 ** DECIMALS))

    setLoading(true)
    try {
      const mintInfo = await getMint(connection, MINT, 'confirmed', TOKEN_2022_PROGRAM_ID)
      const feeCfg = getTransferFeeConfig(mintInfo)
      const bps = feeCfg ? feeCfg.newerTransferFee.transferFeeBasisPoints : 0
      const maxFee = feeCfg ? feeCfg.newerTransferFee.maximumFee : 0n
      let fee = (raw * BigInt(bps)) / 10000n
      if (feeCfg && fee > maxFee) fee = maxFee

      const srcAta = getAssociatedTokenAddressSync(MINT, publicKey, false, TOKEN_2022_PROGRAM_ID)
      const destAta = getAssociatedTokenAddressSync(MINT, dest, false, TOKEN_2022_PROGRAM_ID)

      const tx = new Transaction().add(
        createAssociatedTokenAccountIdempotentInstruction(publicKey, destAta, dest, MINT, TOKEN_2022_PROGRAM_ID),
        createTransferCheckedInstruction(srcAta, MINT, destAta, publicKey, raw, DECIMALS, [], TOKEN_2022_PROGRAM_ID),
      )

      setStatus('Approve the transaction in your wallet…')
      const sig = await sendTransaction(tx, connection)
      setStatus('Confirming on devnet…')
      await connection.confirmTransaction(sig, 'confirmed')

      setResult({
        fee: Number(fee) / 10 ** DECIMALS,
        received: (Number(raw) - Number(fee)) / 10 ** DECIMALS,
        solscan: `https://solscan.io/tx/${sig}?cluster=devnet`,
      })
      setStatus(null)
    } catch (e: any) {
      setError(String(e?.message ?? e)); setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-edge bg-surface p-6 flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Send $ASHEM <span className="text-muted font-normal">(see the fee live)</span></h2>
      <p className="text-sm text-muted leading-relaxed">
        Send any amount to any devnet address. Token-2022 withholds a 1.5% transfer fee
        (capped at 100,000 $ASHEM per tx) on every transfer — including this one.
      </p>
      <input
        value={to} onChange={(e) => setTo(e.target.value)}
        placeholder="Destination address"
        className="rounded-lg border border-edge bg-bg px-3 py-2 text-sm mono placeholder:text-muted focus:border-accent outline-none"
      />
      <input
        value={amount} onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount of $ASHEM" inputMode="decimal"
        className="rounded-lg border border-edge bg-bg px-3 py-2 text-sm mono placeholder:text-muted focus:border-accent outline-none"
      />
      <button
        onClick={transfer} disabled={!publicKey || loading}
        className="self-start rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-hover transition-colors disabled:opacity-40"
      >
        {loading ? 'Sending…' : publicKey ? 'Send $ASHEM' : 'Connect wallet first'}
      </button>
      {status && <p className="text-sm text-muted">{status}</p>}
      {result && (
        <div className="text-sm text-green-400 flex flex-col gap-1">
          <span>Fee withheld this tx: <b className="mono">{result.fee.toLocaleString()}</b> $ASHEM</span>
          <span>Recipient received: <b className="mono">{result.received.toLocaleString()}</b> $ASHEM</span>
          <a className="text-accent underline" href={result.solscan} target="_blank" rel="noreferrer">View on Solscan</a>
        </div>
      )}
      {error && <p className="text-sm text-red-400 break-all">{error}</p>}
    </section>
  )
}