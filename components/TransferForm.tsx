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

const MINT_ADDRESS = process.env.NEXT_PUBLIC_ASHEM_MINT
const MINT = MINT_ADDRESS ? new PublicKey(MINT_ADDRESS) : null
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

  // Preview fee calculation
  const uiAmount = parseFloat(amount) || 0
  const previewFee = uiAmount > 0 ? uiAmount * 0.015 : 0
  const previewReceived = uiAmount - previewFee

  async function transfer() {
    setError(null); setResult(null)
    if (!publicKey) { setError('Connect a wallet first.'); return }
    let dest: PublicKey
    try { dest = new PublicKey(to.trim()) } catch { setError('Invalid destination address.'); return }
    if (!uiAmount || uiAmount <= 0) { setError('Enter a valid amount.'); return }
    const raw = BigInt(Math.floor(uiAmount * 10 ** DECIMALS))

    if (!MINT) { setError('NEXT_PUBLIC_ASHEM_MINT not configured.'); return }
    setLoading(true)
    try {
      const mintPk = MINT!
      const mintInfo = await getMint(connection, mintPk, 'confirmed', TOKEN_2022_PROGRAM_ID)
      const feeCfg = getTransferFeeConfig(mintInfo)
      const bps = feeCfg ? feeCfg.newerTransferFee.transferFeeBasisPoints : 0
      const maxFee = feeCfg ? feeCfg.newerTransferFee.maximumFee : 0n
      let fee = (raw * BigInt(bps)) / 10000n
      if (feeCfg && fee > maxFee) fee = maxFee

      const srcAta = getAssociatedTokenAddressSync(mintPk, publicKey, false, TOKEN_2022_PROGRAM_ID)
      const destAta = getAssociatedTokenAddressSync(mintPk, dest, false, TOKEN_2022_PROGRAM_ID)

      const tx = new Transaction().add(
        createAssociatedTokenAccountIdempotentInstruction(publicKey, destAta, dest, mintPk, TOKEN_2022_PROGRAM_ID),
        createTransferCheckedInstruction(srcAta, mintPk, destAta, publicKey, raw, DECIMALS, [], TOKEN_2022_PROGRAM_ID),
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

  const locked = !publicKey

  return (
    <section className="card-obsidian p-6 flex flex-col gap-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(234,88,12,0.15)',
            border: '1px solid rgba(234,88,12,0.25)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold">Send $ASHEM <span className="text-muted font-normal text-sm">— see the fee live</span></h2>
          <p className="text-xs text-muted">Token-2022 withholds 1.5% on every transfer</p>
        </div>
      </div>

      {/* Fee Flow Diagram */}
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{
          background: 'rgba(14,10,7,0.8)',
          border: '1px solid rgba(234,88,12,0.12)',
        }}
      >
        <div className="text-xs text-muted uppercase tracking-wider font-semibold">Fee Flow Diagram</div>
        <div className="flex items-center gap-2">
          {/* Sender */}
          <div
            className="flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg"
            style={{ background: 'rgba(234,88,12,0.1)', border: '1px solid rgba(234,88,12,0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-xs font-bold text-accent">YOU</span>
            <span className="mono text-xs text-muted">{uiAmount > 0 ? uiAmount.toLocaleString() : '…'}</span>
          </div>

          {/* Arrow with Token-2022 label */}
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="flex items-center gap-1 w-full">
              <div className="flex-1 h-px" style={{ background: 'rgba(234,88,12,0.4)' }} />
              <div
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{ background: 'rgba(234,88,12,0.15)', color: 'var(--accent)', fontSize: '0.6rem', whiteSpace: 'nowrap' }}
              >
                Token-2022
              </div>
              <div className="flex-1 h-px" style={{ background: 'rgba(234,88,12,0.4)' }} />
            </div>
          </div>

          {/* Fork symbol */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <svg width="24" height="40" viewBox="0 0 24 40" fill="none" aria-hidden="true">
              <line x1="0" y1="20" x2="12" y2="20" stroke="rgba(234,88,12,0.5)" strokeWidth="1.5" />
              <line x1="12" y1="20" x2="24" y2="8" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5" />
              <line x1="12" y1="20" x2="24" y2="32" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Two outputs stacked */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {/* Vault — 1.5% */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.9)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div>
                <div className="text-xs font-bold text-red-400">1.5% Fee</div>
                <div className="mono text-xs text-muted">{uiAmount > 0 ? previewFee.toFixed(4) : '—'}</div>
                <div className="text-xs text-muted" style={{ fontSize: '0.6rem' }}>→ Vault</div>
              </div>
            </div>
            {/* Recipient — 98.5% */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.9)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <div>
                <div className="text-xs font-bold text-green-400">98.5% Net</div>
                <div className="mono text-xs text-muted">{uiAmount > 0 ? previewReceived.toFixed(4) : '—'}</div>
                <div className="text-xs text-muted" style={{ fontSize: '0.6rem' }}>→ Recipient</div>
              </div>
            </div>
          </div>
        </div>

        {/* Running mascot */}
        <div className="flex items-center gap-3 mt-1">
          <img
            src="/mascot-standing.png"
            alt="Ash mascot carrying tokens"
            className="h-14 flex-shrink-0"
            style={{
              width: 'auto',
              filter: 'drop-shadow(0 0 10px rgba(234,88,12,0.5)) drop-shadow(0 4px 10px rgba(0,0,0,0.7))',
            }}
          />
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,236,228,0.55)' }}>
            Every transfer, Ash physically carries your tokens — delivering 98.5% to the destination while the Token-2022 protocol retains 1.5% for the harvest vault.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-3">
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Destination address (Base58)"
          className="input-rock"
          disabled={locked}
          aria-label="Destination wallet address"
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount of $ASHEM"
          inputMode="decimal"
          className="input-rock"
          disabled={locked}
          aria-label="Amount of ASHEM to send"
        />

        <button
          onClick={transfer}
          disabled={locked || loading}
          className="btn-fire rounded-xl py-3 text-sm self-start px-6"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
              {status ?? 'Sending…'}
            </span>
          ) : locked ? 'Connect Wallet First' : 'Send $ASHEM'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className="flex items-start gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
          }}
        >
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-green-400">
              Fee withheld: <strong className="mono">{result.fee.toLocaleString()}</strong> $ASHEM
            </span>
            <span className="text-green-400">
              Recipient received: <strong className="mono">{result.received.toLocaleString()}</strong> $ASHEM
            </span>
            <a className="text-accent text-xs underline underline-offset-2" href={result.solscan} target="_blank" rel="noreferrer">
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
