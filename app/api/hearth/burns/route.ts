// The Hearth — Burn pulse feed: the latest burns from the MAINNET harvest ledger.
// Pre-liquidity the file may not exist yet (no harvests) → returns an empty list,
// which the UI renders as the "no burns yet" empty state. Shared ~60s cache.

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LEDGER = 'https://raw.githubusercontent.com/AshandEmber-Sol/-ASHEM/main/state/mainnet/harvest-ledger.csv'
const TTL = 60_000
let cache: { ts: number; body: Record<string, unknown> } | null = null

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) return NextResponse.json(cache.body)
  try {
    const r = await fetch(LEDGER, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'ashem-hearth' },
    })
    if (!r.ok) {
      // 404 = ledger not created yet (pre-liquidity). That's expected → empty feed.
      const body = { ok: true, burns: [] }
      cache = { ts: Date.now(), body }
      return NextResponse.json(body)
    }
    const text = await r.text()
    // CSV rows: ts,total,burn_cut,dev_cut,burn_sig,dev_sig  (amounts in base units, 9 decimals)
    const burns = text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(',')
        const ts = Date.parse(parts[0]) || 0
        const amount = Number(parts[2]) / 1e9 // burn_cut → whole tokens
        const tx = (parts[4] || '').trim()
        return { ts, amount, tx }
      })
      .filter((b) => b.tx && b.tx !== 'skipped_zero' && b.tx !== 'already' && Number.isFinite(b.amount))
      .reverse()
      .slice(0, 8)
    const body = { ok: true, burns }
    cache = { ts: Date.now(), body }
    return NextResponse.json(body)
  } catch {
    if (cache) return NextResponse.json({ ...cache.body, stale: true })
    return NextResponse.json({ ok: true, burns: [] })
  }
}
