import { Connection, PublicKey } from '@solana/web3.js'

// Rate-limit on-chain: el historial del destinatario ES el registro.
// true si el dispensador ya envió a `recipient` dentro de la ventana.
export async function alreadyClaimed(
  connection: Connection,
  dispenser: PublicKey,
  recipient: PublicKey,
  windowMs: number,
): Promise<boolean> {
  const cutoff = Date.now() / 1000 - windowMs / 1000
  const sigs = await connection.getSignaturesForAddress(recipient, { limit: 25 }, 'confirmed')
  for (const s of sigs) {
    if (s.err || !s.blockTime) continue
    if (s.blockTime < cutoff) break // vienen de nuevo -> viejo
    const tx = await connection.getParsedTransaction(s.signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    })
    if (!tx) continue
    const signedByDispenser = tx.transaction.message.accountKeys.some(
      (k) => k.signer && k.pubkey.equals(dispenser),
    )
    if (signedByDispenser) return true
  }
  return false
}