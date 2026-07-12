import { NextRequest, NextResponse } from 'next/server'

const TOKEN = process.env.GH_DISPATCH_TOKEN
const REPO = process.env.GH_REPO || 'AshandEmber-Sol/-ASHEM'
const GH = 'https://api.github.com'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get('runId')
  if (!runId) return NextResponse.json({ error: 'missing runId' }, { status: 400 })
  const res = await fetch(`${GH}/repos/${REPO}/actions/runs/${runId}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) return NextResponse.json({ error: 'status fetch failed' }, { status: 502 })
  const d = await res.json()
  return NextResponse.json({ status: d.status, conclusion: d.conclusion, html_url: d.html_url })
}