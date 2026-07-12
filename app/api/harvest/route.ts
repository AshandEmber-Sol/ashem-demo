import { NextResponse } from 'next/server'

const TOKEN = process.env.GH_DISPATCH_TOKEN
const REPO = process.env.GH_REPO || 'AshandEmber-Sol/-ASHEM'
const WORKFLOW = process.env.GH_WORKFLOW || 'endgame.yml'
const GH = 'https://api.github.com'

export const runtime = 'nodejs'

let lastDispatch = 0
const COOLDOWN_MS = 60_000

function ghHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export async function POST() {
  if (!TOKEN) return NextResponse.json({ error: 'server not configured' }, { status: 500 })

  const now = Date.now()
  if (now - lastDispatch < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - lastDispatch)) / 1000)
    return NextResponse.json({ error: `a harvest ran recently — try again in ~${wait}s` }, { status: 429 })
  }

  const dispatchedAt = new Date().toISOString()
  const res = await fetch(`${GH}/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: 'POST', headers: ghHeaders(), body: JSON.stringify({ ref: 'main' }),
  })
  if (res.status !== 204) {
    return NextResponse.json({ error: 'dispatch failed', detail: await res.text() }, { status: 502 })
  }
  lastDispatch = now

  // El dispatch no devuelve run_id: hay que buscar el run recién creado
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