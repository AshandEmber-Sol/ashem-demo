// The Hearth — Proof Wall data: community verifications counter (Redis) + Discord online
// (server-side read of the public widget.json, so the client doesn't depend on Discord CORS).
// Shared ~30s cache so concurrent visitors don't each hit Redis/Discord.

import { NextResponse } from 'next/server'
import { getVerifications } from '../../../../lib/hearth-metrics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GUILD = '1537182065869455542'
const TTL = 30_000
let cache: { ts: number; body: Record<string, unknown> } | null = null

async function discordOnline(): Promise<number | null> {
  try {
    const r = await fetch(`https://discord.com/api/guilds/${GUILD}/widget.json`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return null
    const j = await r.json()
    return typeof j?.presence_count === 'number' ? j.presence_count : null
  } catch {
    return null
  }
}

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) return NextResponse.json(cache.body)
  const [verifications, online] = await Promise.all([getVerifications(), discordOnline()])
  const body = { ok: true, verifications, online }
  cache = { ts: Date.now(), body }
  return NextResponse.json(body)
}
