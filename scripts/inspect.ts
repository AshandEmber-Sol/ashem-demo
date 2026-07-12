import { PublicKey } from '@solana/web3.js'
import { connection, owner, initRaydium } from './lib'
import 'dotenv/config'

async function main() {
  console.log('RPC:', process.env.RPC_URL)
  console.log('Owner (pool-tester):', owner.publicKey.toBase58())
  const bal = await connection.getBalance(owner.publicKey)
  console.log('SOL balance:', bal / 1e9)

  const mint = new PublicKey(process.env.ASHEM_MINT!)
  const info = await connection.getParsedAccountInfo(mint)
  const data: any = info.value?.data
  console.log('Mint program owner:', info.value?.owner.toBase58())
  console.log('Mint decimals:', data?.parsed?.info?.decimals)
  const exts: any[] = data?.parsed?.info?.extensions ?? []
  const fee = exts.find((e) => e.extension === 'transferFeeConfig')
  console.log('transferFeeConfig present:', !!fee)
  if (fee) console.log('newer fee:', JSON.stringify(fee.state?.newerTransferFee))

  const raydium = await initRaydium()
  console.log('Raydium loaded OK:', !!raydium)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
