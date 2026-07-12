import { Connection, Keypair } from '@solana/web3.js'
import { Raydium } from '@raydium-io/raydium-sdk-v2'
import fs from 'fs'
import 'dotenv/config'

export const RPC_URL = process.env.RPC_URL!
export const connection = new Connection(RPC_URL, 'confirmed')

export function loadKeypair(path: string): Keypair {
  const secret = JSON.parse(fs.readFileSync(path, 'utf-8'))
  return Keypair.fromSecretKey(Uint8Array.from(secret))
}

export const owner = loadKeypair(process.env.POOL_TESTER_KEYPAIR!)

export async function initRaydium() {
  return Raydium.load({
    connection,
    owner,
    cluster: 'devnet',
    disableFeatureCheck: true,
    blockhashCommitment: 'confirmed',
  })
}
