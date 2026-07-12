import { initRaydium } from './lib'
import 'dotenv/config'

const POOL_ID = process.env.POOL_ID!
const bnStr = (k: string, v: any) =>
  v && typeof v === 'object' && typeof v.toString === 'function' && v.constructor?.name === 'BN'
    ? v.toString() : v

async function main() {
  const raydium = await initRaydium()
  const data: any = await raydium.cpmm.getPoolInfoFromRpc(POOL_ID)
  console.log('=== rpcData keys ===', Object.keys(data.rpcData))
  console.log('=== configInfo ===')
  console.log(JSON.stringify(data.rpcData.configInfo, bnStr, 2))
  console.log('=== rpcData fee-ish fields ===')
  for (const k of Object.keys(data.rpcData)) {
    if (/fee|creator/i.test(k)) console.log(k, '=', data.rpcData[k]?.toString?.() ?? data.rpcData[k])
  }
  console.log('=== poolInfo fee-ish fields ===')
  for (const k of Object.keys(data.poolInfo)) {
    if (/fee|creator/i.test(k)) console.log(k, '=', JSON.stringify(data.poolInfo[k], bnStr))
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
