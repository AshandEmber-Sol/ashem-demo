import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js'
import BN from 'bn.js'
import { Raydium, CurveCalculator, TxVersion } from '@raydium-io/raydium-sdk-v2'

const RPC = process.env.RPC_URL || 'https://api.devnet.solana.com'
const POOL_ID = process.env.POOL_ID!
const ASHEM = process.env.ASHEM_MINT!

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let wallet: string, amount: number
  try {
    const body = await req.json()
    wallet = body.wallet
    amount = Number(body.amount)
    new PublicKey(wallet)
    if (!amount || amount <= 0) throw new Error('bad amount')
  } catch {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 })
  }

  try {
    const owner = new PublicKey(wallet)
    const connection = new Connection(RPC, 'confirmed')
    const raydium = await Raydium.load({
      connection, owner, cluster: 'devnet',
      disableFeatureCheck: true, blockhashCommitment: 'confirmed',
    })

    const data: any = await raydium.cpmm.getPoolInfoFromRpc(POOL_ID)
    const { poolInfo, poolKeys, rpcData } = data
    const ci = rpcData.configInfo

    const baseIn = ASHEM === poolInfo.mintA.address
    const inputAmount = new BN(String(Math.floor(amount * 1e9)))

    const swapResult = CurveCalculator.swapBaseInput(
      inputAmount,
      baseIn ? rpcData.baseReserve : rpcData.quoteReserve,
      baseIn ? rpcData.quoteReserve : rpcData.baseReserve,
      ci.tradeFeeRate, ci.creatorFeeRate, ci.protocolFeeRate, ci.fundFeeRate, false,
    )

    const { transaction, signers }: any = await raydium.cpmm.swap({
      poolInfo, poolKeys, inputAmount, swapResult,
      slippage: 0.05, baseIn, txVersion: TxVersion.V0,
    })

    if (signers && signers.length) (transaction as VersionedTransaction).sign(signers)

    const b64 = Buffer.from((transaction as VersionedTransaction).serialize()).toString('base64')
    return NextResponse.json({ tx: b64, expectedWsolOut: swapResult.outputAmount.toString() })
  } catch (e: any) {
    return NextResponse.json({ error: 'build failed', detail: String(e?.message ?? e) }, { status: 500 })
  }
}
