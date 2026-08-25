// The Hearth — Liquidity Risk Scanner data.
// Server-side proxy to the GeckoTerminal API (free, no key; attribution required in the UI).
// Two modes:
//   - default (no ?pool): $ASHEM — auto-discovers the token's top pool by mint.
//     Pre-liquidity there are no pools yet → { found:false, reason:'no-pool' } → honest empty state.
//   - ?pool=<addr>: scans any Solana pool the user pastes (user-initiated).
// Protections: per-pool ~60s cache (concurrent visitors share one upstream call) +
// best-effort per-IP cooldown via Upstash (same instance as the harvest cooldown).

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GT = 'https://api.geckoterminal.com/api/v2'
const NETWORK = 'solana'
const ASHEM_MINT = 'BGRvzRVpdPvzHQXPax5MqERsxZLprvWVTvUzpUUUhXot'
const TTL = 60_000
const LOW_ABSOLUTE_USD = 10_000 // below this, flag "very low absolute liquidity" regardless of ratio

// Solana base58 address, ~32-44 chars. Loose validation to reject junk before hitting GT.
const ADDR_RE = /^[1-9A-HJ-NP-Za-km-z]{32,50}$/

type Result = Record<string, unknown>
const cache = new Map<string, { ts: number; body: Result }>()

// ── best-effort per-IP rate limit (Upstash REST; skipped if not configured) ──
const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN
async function allowedByRateLimit(ip: string): Promise<boolean> {
  if (!KV_URL || !KV_TOKEN) return true // no KV in dev → don't block
  const key = 'rl:liq:' + ip.replace(/[^0-9a-zA-Z.:_-]/g, '')
  try {
    const r = await fetch(`${KV_URL}/set/${key}/1/PX/1500/NX`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    })
    if (!r.ok) return true // KV hiccup → fail open
    const j = await r.json()
    return j?.result === 'OK' // OK = we set it (allowed); null = key existed (too soon)
  } catch {
    return true
  }
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : 0
}

function scoreFromAttributes(a: Record<string, unknown>, poolAddress: string): Result {
  const reserveUsd = num(a.reserve_in_usd)
  const fdvUsd = num(a.fdv_usd)
  const marketCapUsd = num(a.market_cap_usd) // may be 0/null; FDV is the reliable denominator
  const priceUsd = num(a.base_token_price_usd)
  const volObj = (a.volume_usd as Record<string, unknown>) || {}
  const volume24h = num(volObj.h24)

  const ratioPct = reserveUsd > 0 && fdvUsd > 0 ? (reserveUsd / fdvUsd) * 100 : null
  let risk: 'very-thin' | 'thin' | 'healthy' | 'nodata'
  if (ratioPct === null) risk = 'nodata'
  else if (ratioPct < 3) risk = 'very-thin'
  else if (ratioPct < 6) risk = 'thin'
  else risk = 'healthy'

  return {
    found: true,
    tokenName: (a.name as string) || 'Unknown pool',
    poolAddress,
    reserveUsd,
    fdvUsd,
    marketCapUsd,
    priceUsd,
    volume24h,
    ratioPct,
    risk,
    veryLowAbsolute: reserveUsd > 0 && reserveUsd < LOW_ABSOLUTE_USD,
    source: 'geckoterminal',
    fetchedAt: Date.now(),
  }
}

async function gtFetch(path: string): Promise<Response> {
  return fetch(`${GT}${path}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
    headers: { Accept: 'application/json', 'User-Agent': 'ashem-hearth' },
  })
}

// Official token logo + symbol from the pool's base_token (via ?include=base_token).
// GeckoTerminal sometimes returns a "missing.png" placeholder → treat as no logo.
function pickBaseToken(poolObj: Record<string, unknown>, included: unknown): Result {
  const rel = (poolObj?.relationships as Record<string, unknown>) || {}
  const baseId = ((rel.base_token as Record<string, unknown>)?.data as Record<string, unknown>)?.id
  const list = Array.isArray(included) ? (included as Record<string, unknown>[]) : []
  const tok = list.find((x) => x?.id === baseId && x?.type === 'token')
  const a = (tok?.attributes as Record<string, unknown>) || {}
  const raw = a.image_url as string | undefined
  const logoUrl = raw && !/missing/i.test(raw) ? raw : null
  return { logoUrl, symbol: (a.symbol as string) || null }
}

async function scanPool(pool: string): Promise<Result> {
  const r = await gtFetch(`/networks/${NETWORK}/pools/${pool}?include=base_token`)
  if (r.status === 404) return { found: false, reason: 'not-found' }
  if (r.status === 429) return { found: false, reason: 'rate-limited' }
  if (!r.ok) return { found: false, reason: 'upstream-error' }
  const j = await r.json()
  const attrs = j?.data?.attributes
  if (!attrs) return { found: false, reason: 'not-found' }
  return { ...scoreFromAttributes(attrs, pool), ...pickBaseToken(j?.data, j?.included) }
}

async function scanAshem(): Promise<Result> {
  const r = await gtFetch(`/networks/${NETWORK}/tokens/${ASHEM_MINT}/pools?include=base_token`)
  if (r.status === 404) return { found: false, reason: 'no-pool', mode: 'ashem' }
  if (r.status === 429) return { found: false, reason: 'rate-limited', mode: 'ashem' }
  if (!r.ok) return { found: false, reason: 'upstream-error', mode: 'ashem' }
  const j = await r.json()
  const pools = Array.isArray(j?.data) ? j.data : []
  if (pools.length === 0) return { found: false, reason: 'no-pool', mode: 'ashem' }
  // Pick the deepest pool by reserve.
  const top = pools.reduce((best: Record<string, unknown>, p: Record<string, unknown>) => {
    const a = (p?.attributes as Record<string, unknown>) || {}
    const b = (best?.attributes as Record<string, unknown>) || {}
    return num(a.reserve_in_usd) > num(b.reserve_in_usd) ? p : best
  }, pools[0])
  const attrs = (top?.attributes as Record<string, unknown>) || {}
  const addr = (attrs.address as string) || String(top?.id || '').replace(`${NETWORK}_`, '')
  return { ...scoreFromAttributes(attrs, addr), ...pickBaseToken(top, j?.included), mode: 'ashem' }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const poolParam = (searchParams.get('pool') || '').trim()
  const mode = poolParam ? 'pool' : 'ashem'

  if (mode === 'pool' && !ADDR_RE.test(poolParam)) {
    return NextResponse.json({ ok: true, found: false, reason: 'invalid-address', mode }, { status: 200 })
  }

  const cacheKey = mode === 'pool' ? `pool:${poolParam}` : 'ashem'
  const hit = cache.get(cacheKey)
  if (hit && Date.now() - hit.ts < TTL) return NextResponse.json({ ok: true, ...hit.body, cached: true })

  // Rate-limit only user-initiated arbitrary scans (the $ASHEM default is cached & shared).
  if (mode === 'pool') {
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon'
    if (!(await allowedByRateLimit(ip))) {
      return NextResponse.json({ ok: true, found: false, reason: 'too-fast', mode }, { status: 200 })
    }
  }

  try {
    const body = mode === 'pool' ? await scanPool(poolParam) : await scanAshem()
    if (body.found) cache.set(cacheKey, { ts: Date.now(), body }) // only cache successful reads
    return NextResponse.json({ ok: true, ...body })
  } catch {
    if (hit) return NextResponse.json({ ok: true, ...hit.body, stale: true })
    return NextResponse.json({ ok: true, found: false, reason: 'error', mode })
  }
}
