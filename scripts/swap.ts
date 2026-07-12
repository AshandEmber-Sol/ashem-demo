import BN from 'bn.js'
import { CurveCalculator, TxVersion } from '@raydium-io/raydium-sdk-v2'
import { initRaydium } from './lib'
import 'dotenv/config'

const POOL_ID = process.env.POOL_ID!
const ASHEM = process.env.ASHEM_MINT!

async function main() {
  const raydium = await initRaydium()
  const data: any = await raydium.cpmm.getPoolInfoFromRpc(POOL_ID)
  const { poolInfo, poolKeys, rpcData } = data
  const ci = rpcData.configInfo

  const baseIn = ASHEM === poolInfo.mintA.address // ASHEM = mintB -> false
  const inputAmount = new BN('1000000000000000')  // 1,000,000 * 1e9 ASHEM (venta)

  const swapResult = CurveCalculator.swapBaseInput(
    inputAmount,
    baseIn ? rpcData.baseReserve : rpcData.quoteReserve,
    baseIn ? rpcData.quoteReserve : rpcData.baseReserve,
    ci.tradeFeeRate,
    ci.creatorFeeRate,
    ci.protocolFeeRate,
    ci.fundFeeRate,
    false, // isCreatorFeeOnInput (creator fee desactivado)
  )
  console.log('baseIn:', baseIn)
  console.log('swapResult:', JSON.stringify(swapResult,
    (k, v) => (v && v.constructor?.name === 'BN' ? v.toString() : v)))

  const { execute } = await raydium.cpmm.swap({
    poolInfo, poolKeys,
    inputAmount,
    swapResult,
    slippage: 0.05,
    baseIn,
    txVersion: TxVersion.V0,
  })
  const { txId } = await execute({ sendAndConfirm: true })
  console.log('SWAP DONE txId=', txId)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
