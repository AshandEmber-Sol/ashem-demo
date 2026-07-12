import { Connection, VersionedTransaction } from '@solana/web3.js'
import 'dotenv/config'

async function main() {
  const wallet = process.argv[2] || 'FGnAQDY9hqoK87Zkgebtr3xVa4GLagRv4FmyemtdUTnC'
  const res = await fetch('http://localhost:3000/api/swap-tx', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ wallet, amount: 200 }),
  })
  const data: any = await res.json()
  if (!data.tx) { console.log('no tx:', data); return }

  const tx = VersionedTransaction.deserialize(Buffer.from(data.tx, 'base64'))
  console.log('numRequiredSignatures:', tx.message.header.numRequiredSignatures)
  console.log('signatures:', tx.signatures.map((s) => (s.every((b) => b === 0) ? 'EMPTY' : 'SET')))

  const conn = new Connection(process.env.RPC_URL!, 'confirmed')
  const sim = await conn.simulateTransaction(tx, { sigVerify: false, replaceRecentBlockhash: true })
  console.log('sim err:', JSON.stringify(sim.value.err))
  console.log('--- logs ---')
  console.log((sim.value.logs || []).join('\n'))
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
