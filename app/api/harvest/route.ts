import { NextResponse } from 'next/server'
import { acquireCooldown, releaseCooldown } from '@/lib/cooldown'

const TOKEN = process.env.GH_DISPATCH_TOKEN
const REPO = process.env.GH_REPO || 'AshandEmber-Sol/-ASHEM'
const WORKFLOW = process.env.GH_WORKFLOW || 'endgame.yml'
const GH = 'https://api.github.com'

export const runtime = 'nodejs'

// Global cooldown: one dispatch per window across ALL instances. Backed by
// Redis (Upstash) so it survives serverless cold starts and is atomic under
// concurrent requests — an in-memory counter let parallel invocations each
// pass and spam GitHub Actions (real CI minutes).
const COOLDOWN_MS = 60_000
const COOLDOWN_KEY = 'harvest:cooldown'

function ghHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export async function POST() {
  if (!TOKEN) return NextResponse.json({ error: 'server not configured' }, { status: 500 })

  // Atomically claim the dispatch slot before doing anything.
  const slot = await acquireCooldown(COOLDOWN_KEY, COOLDOWN_MS)
  if (!slot.ok) {
    const wait = Math.ceil(slot.waitMs / 1000)
    return NextResponse.json({ error: `a harvest ran recently — try again in ~${wait}s` }, { status: 429 })
  }

  const dispatchedAt = new Date().toISOString()
  let res: Response
  try {
    res = await fetch(`${GH}/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: 'POST', headers: ghHeaders(), body: JSON.stringify({ ref: 'main' }),
    })
  } catch (e: any) {
    await releaseCooldown(COOLDOWN_KEY) // dispatch never happened -> allow retry
    return NextResponse.json({ error: 'dispatch failed', detail: String(e?.message ?? e) }, { status: 502 })
  }
  if (res.status !== 204) {
    await releaseCooldown(COOLDOWN_KEY) // dispatch rejected -> allow retry
    return NextResponse.json({ error: 'dispatch failed', detail: await res.text() }, { status: 502 })
  }

  // The dispatch doesn't return a run_id: we have to look up the run that was just created
  let runId: number | null = null
  let runUrl: string | null = null
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 2500))
    const r = await fetch(`${GH}/repos/${REPO}/actions/runs?event=workflow_dispatch&branch=main&per_page=5`, { headers: ghHeaders() })
    if (r.ok) {
      const d = await r.json()
      const run = (d.workflow_runs || []).find((w: any) => w.created_at >= dispatchedAt)
      if (run) { runId = run.id; runUrl = run.html_url; break }
    }
  }

  return NextResponse.json({ ok: true, runId, runUrl })
}
