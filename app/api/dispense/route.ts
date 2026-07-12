import { NextRequest, NextResponse } from 'next/server'
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  TOKEN_2022_PROGRAM_ID,
  getAccount,
} from '@solana/spl-token'
import {
  connection, ASHEM_MINT, ASHEM_DECIMALS, getDispenser,
  DISPENSE_SOL_LAMPORTS, DISPENSE_ASHEM_UI, RATE_LIMIT_MS,
} from '@/lib/solana'
import { alreadyClaimed } from '@/lib/rateLimitChain'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let wallet: string
  try {
    wallet = (await req.json()).wallet
    new PublicKey(wallet)
  } catch {
    return NextResponse.json({ error: 'invalid wallet' }, { status: 400 })
  }

  const dispenser = getDispenser()
  const recipient = new PublicKey(wallet)

  // Rate-limit ON-CHAIN: el historial del destinatario es el registro (persiste en serverless)
  try {
    if (await alreadyClaimed(connection, dispenser.publicKey, recipient, RATE_LIMIT_MS)) {
      const hrs = Math.round(RATE_LIMIT_MS / 3_600_000)
      return NextResponse.json({ error: `already claimed — one claim per wallet every ${hrs}h` }, { status: 429 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: 'rate-limit check failed', detail: String(e?.message ?? e) }, { status: 502 })
  }

  const srcAta = getAssociatedTokenAddressSync(ASHEM_MINT, dispenser.publicKey, false, TOKEN_2022_PROGRAM_ID)
  const ashemRaw = BigInt(DISPENSE_ASHEM_UI) * 10n ** BigInt(ASHEM_DECIMALS)

  const solBal = await connection.getBalance(dispenser.publicKey)
  let ashemBal = 0n
  try { ashemBal = (await getAccount(connection, srcAta, 'confirmed', TOKEN_2022_PROGRAM_ID)).amount } catch {}
  if (solBal < DISPENSE_SOL_LAMPORTS + 5_000_000 || ashemBal < ashemRaw) {
    return NextResponse.json({ error: 'test funds refilling — check back soon' }, { status: 503 })
  }

  const destAta = getAssociatedTokenAddressSync(ASHEM_MINT, recipient, false, TOKEN_2022_PROGRAM_ID)
  const tx = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: dispenser.publicKey, toPubkey: recipient, lamports: DISPENSE_SOL_LAMPORTS }),
    createAssociatedTokenAccountIdempotentInstruction(dispenser.publicKey, destAta, recipient, ASHEM_MINT, TOKEN_2022_PROGRAM_ID),
    createTransferCheckedInstruction(srcAta, ASHEM_MINT, destAta, dispenser.publicKey, ashemRaw, ASHEM_DECIMALS, [], TOKEN_2022_PROGRAM_ID),
  )

  try {
    const sig = await connection.sendTransaction(tx, [dispenser])
    await connection.confirmTransaction(sig, 'confirmed')
    return NextResponse.json({
      ok: true, signature: sig,
      sol: DISPENSE_SOL_LAMPORTS / 1e9, ashem: DISPENSE_ASHEM_UI,
      solscan: `https://solscan.io/tx/${sig}?cluster=devnet`,
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'dispense failed', detail: String(e?.message ?? e) }, { status: 500 })
  }
}