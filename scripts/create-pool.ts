import { PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import BN from 'bn.js'
import { getCpmmPdaAmmConfigId, TxVersion } from '@raydium-io/raydium-sdk-v2'
import { initRaydium } from './lib'
import 'dotenv/config'

const WSOL = 'So11111111111111111111111111111111111111112'
// Devnet CPMM (verificado on-chain: executable)
const DEVNET_CPMM_PROGRAM = new PublicKey('CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW')
const DEVNET_CPMM_FEE_ACC = new PublicKey('G11FKBRaAkHAKuLCgLM6K6NUc9rTjPAznRCjZifrTQe2')

function tokenInfo(address: string, programId: string, decimals: number) {
  return {
    chainId: 101, address, programId, logoURI: '',
    symbol: '', name: '', decimals, tags: [], extensions: {},
  } as any
}

async function main() {
  const raydium = await initRaydium()
  const ASHEM = process.env.ASHEM_MINT!

  const ashem = tokenInfo(ASHEM, TOKEN_2022_PROGRAM_ID.toBase58(), 9)
  const wsol = tokenInfo(WSOL, TOKEN_PROGRAM_ID.toBase58(), 9)
  const ashemAmount = new BN('10000000000000000') // 10,000,000 * 1e9
  const wsolAmount = new BN('500000000')          // 0.5 * 1e9

  const cmp = new PublicKey(ASHEM).toBuffer().compare(new PublicKey(WSOL).toBuffer())
  const [mintA, mintB, mintAAmount, mintBAmount] =
    cmp < 0 ? [ashem, wsol, ashemAmount, wsolAmount]
            : [wsol, ashem, wsolAmount, ashemAmount]

  const feeConfigs = await raydium.api.getCpmmConfigs()
  console.log('feeConfigs count:', feeConfigs.length)
  feeConfigs.forEach((c) => {
    c.id = getCpmmPdaAmmConfigId(DEVNET_CPMM_PROGRAM, c.index).publicKey.toBase58()
  })
  console.log('using feeConfig[0]:', feeConfigs[0]?.id, 'index', feeConfigs[0]?.index)

  console.log('Creating CPMM pool  mintA=', mintA.address, ' mintB=', mintB.address)
  const { execute, extInfo } = await raydium.cpmm.createPool({
    programId: DEVNET_CPMM_PROGRAM,
    poolFeeAccount: DEVNET_CPMM_FEE_ACC,
    mintA, mintB, mintAAmount, mintBAmount,
    startTime: new BN(0),
    feeConfig: feeConfigs[0],
    associatedOnly: false,
    ownerInfo: { useSOLBalance: true },
    txVersion: TxVersion.V0,
  })

  const { txId } = await execute({ sendAndConfirm: true })
  console.log('POOL CREATED  txId=', txId)
  const addr: any = extInfo.address
  console.log('POOL ID=', addr.poolId.toBase58())
  console.log('poolKeys=', JSON.stringify(
    Object.fromEntries(Object.entries(addr).map(([k, v]: any) => [k, v?.toString?.() ?? v])), null, 2))
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
