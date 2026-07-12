import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import fs from 'fs'

export const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com'
export const connection = new Connection(RPC_URL, 'confirmed')
export const ASHEM_MINT = new PublicKey(process.env.ASHEM_MINT!)
export const ASHEM_DECIMALS = 9

export function getDispenser(): Keypair {
  const raw = process.env.DISPENSER_SECRET_KEY
  if (raw) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)))
  const p = process.env.DISPENSER_KEYPAIR_PATH
  if (!p) throw new Error('No DISPENSER_SECRET_KEY / DISPENSER_KEYPAIR_PATH')
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(p, 'utf-8'))))
}

export const DISPENSE_SOL_LAMPORTS = Number(process.env.DISPENSE_SOL_LAMPORTS || 20_000_000)
export const DISPENSE_ASHEM_UI = Number(process.env.DISPENSE_ASHEM || 5000)
export const RATE_LIMIT_MS = Number(process.env.RATE_LIMIT_HOURS || 24) * 3600_000
