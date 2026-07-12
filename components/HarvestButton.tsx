'use client'
import { useState } from 'react'

export function HarvestButton() {
  const [status, setStatus] = useState<string | null>(null)
  const [runUrl, setRunUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  async function harvest() {
    setError(null); setDone(null); setRunUrl(null)
    setLoading(true); setStatus('Triggering the real harvest workflow…')
    try {
      const res = await fetch('/api/harvest', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError((data.error || 'failed') + (data.detail ? `: ${data.detail}` : '')); return }
      setRunUrl(data.runUrl)
      if (!data.runId) { setStatus('Dispatched — see the run on GitHub Actions.'); return }

      setStatus('Harvest running on GitHub Actions — the real endgame.sh, not a simulation…')
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 5000))
        const r = await fetch(`/api/harvest-status?runId=${data.runId}`)
        const s = await r.json()
        if (s.status === 'completed') { setDone(s.conclusion); setStatus(null); return }
      }
      setStatus('Still running — check the run on GitHub Actions.')
    } catch (e: any) { setError(String(e?.message ?? e)) }
    finally { setLoading(false) }
  }

  return (
    <section className="rounded-xl border border-neutral-300 p-5 flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Harvest &amp; burn (runs the real engine)</h2>
      <p className="text-sm text-neutral-500">
        Trigger the same GitHub Actions workflow that runs in production. It harvests the withheld
        fees, burns 2/3 and sends 1/3 to the dev wallet — the real endgame.sh, not a simulation.
        It may take ~30–60s to start, and if there are no withheld fees to collect right now, the
        supply won&apos;t change.
      </p>
      <button
        onClick={harvest} disabled={loading}
        className="self-start rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black disabled:opacity-40"
      >
        {loading ? 'Harvesting…' : 'Harvest now'}
      </button>
      {status && <p className="text-sm text-neutral-500">{status}</p>}
      {runUrl && (
        <a className="text-sm underline" href={runUrl} target="_blank" rel="noreferrer">View the run on GitHub Actions</a>
      )}
      {done && (
        <p className="text-sm text-green-700">
          Harvest run {done === 'success' ? 'succeeded' : `finished: ${done}`}. The live mint stats above refresh automatically.
        </p>
      )}
      {error && <p className="text-sm text-red-600 break-all">{error}</p>}
    </section>
  )
}