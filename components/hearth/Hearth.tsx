'use client'

// The Hearth — reconciled from the v0 output.
// Changes vs v0: real deploy tx signatures + Solscan links (v0 hallucinated one),
// real official links, live data (verifications counter + Discord online + burns feed +
// endgame %), project fonts, and everything scoped under `.ashem-hearth` (see hearth.css).

import { useEffect, useState } from 'react'
import './hearth.css'

// ── Real, public data (see -ASHEM/docs/MAINNET-DEPLOY-LOG.md) ──
const LINKS = {
  home: '/', hearth: '/hearth', demo: '/demo', terms: '/terms',
  x: 'https://x.com/ashembersol',
  discord: 'https://discord.gg/x2EXHsztxp',
  github: 'https://github.com/AshandEmber-Sol',
}
const solscanTx = (sig: string) => `https://solscan.io/tx/${sig}`
const shortSig = (sig: string) => `${sig.slice(0, 6)}…`

const STAGES = [
  { label: 'Deploy', detail: '1B minted, supply fixed', state: 'done' },
  { label: 'Authorities locked', detail: 'mint & freeze revoked', state: 'done' },
  { label: 'Burning to the floor', detail: 'harvest + burn every 6h', state: 'active' },
  { label: '300M floor', detail: 'the burn stops, forever', state: 'pending' },
  { label: 'Endgame', detail: 'fee off · keys revoked · proof published', state: 'pending' },
]

// Foundational on-chain events — real tx signatures from the mainnet deploy.
const PROOF_EVENTS = [
  { title: 'Mint created', detail: '1B minted, supply fixed', sig: 'RVmi2AQmmPHazwDqbB1BTsftjD2JKnNda5cbS3xJ3fYAvTvzZhGGSsvyPSY31HMyMzpED3bsjzAtMYmuPWTb6Wu' },
  { title: 'Mint authority revoked', detail: 'no more can ever be minted', sig: 'D8u4mxnXHWkjehDNabnrTDwkiqF6tkRvexQ2NQiSnhyaU1fxng7UdtRGfDzMf4AK3LfGq3sj5JVY41yMMVAz8EU' },
  { title: 'Freeze authority revoked', detail: "your tokens can't be frozen", sig: '3VBQb5iQQGyQPhD63jRLMGhjfNQWJhDViBe1WowhvAUTozh1et1VdKEEc77c2rwL8pdqfX3vnhLd6AMVMHc5qRA5' },
]

interface Burn { amount: number; ts: number; tx: string }

function useHarvestCountdown() {
  const [remaining, setRemaining] = useState('--:--:--')
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const next = new Date(now)
      next.setUTCHours(Math.ceil((now.getUTCHours() + 1) / 6) * 6, 0, 0, 0)
      if (next <= now) next.setUTCHours(next.getUTCHours() + 6, 0, 0, 0)
      const secs = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000))
      const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
      setRemaining([h, m, s].map((v) => String(v).padStart(2, '0')).join(':'))
    }
    update()
    const t = window.setInterval(update, 1000)
    return () => window.clearInterval(t)
  }, [])
  return remaining
}

// Live data: verifications counter + Discord online (from /api/hearth/proof),
// burns feed (/api/hearth/burns), endgame % (/api/mainnet-state). Polls ~45s.
function useHearthData() {
  const [d, setD] = useState<{ verifications: number | null; online: number | null; burns: Burn[] | null; pct: number | null }>({
    verifications: null, online: null, burns: null, pct: null,
  })
  useEffect(() => {
    let alive = true
    const load = async () => {
      const out: Partial<typeof d> = {}
      try { const j = await (await fetch('/api/hearth/proof', { cache: 'no-store' })).json(); out.verifications = j?.verifications?.total ?? 0; out.online = j?.online ?? null } catch {}
      try { const j = await (await fetch('/api/hearth/burns', { cache: 'no-store' })).json(); out.burns = Array.isArray(j?.burns) ? j.burns : [] } catch {}
      try { const j = await (await fetch('/api/mainnet-state', { cache: 'no-store' })).json(); if (typeof j?.supply === 'number') out.pct = Math.max(0, Math.min(100, ((1_000_000_000 - j.supply) / 700_000_000) * 100)) } catch {}
      if (alive) setD((prev) => ({ ...prev, ...out }))
    }
    load()
    const iv = window.setInterval(load, 45000)
    return () => { alive = false; window.clearInterval(iv) }
  }, [])
  return d
}

export default function Hearth() {
  const remaining = useHarvestCountdown()
  const { verifications, online, burns, pct } = useHearthData()

  const pctText = pct === null ? '0.00' : pct.toFixed(2)
  const verifText = verifications === null ? '—' : verifications.toLocaleString('en-US')
  const onlineText = online === null ? '—' : String(online)

  return (
    <div id="top" className="app-shell ashem-hearth">
      <header className="site-header">
        <a className="brand" href={LINKS.home} aria-label="Ash and Ember home">
          <span className="ember-mark" aria-hidden="true" />
          <span>Ash &amp; Ember</span>
          <span className="brand-code">$ASHEM</span>
        </a>
        <nav aria-label="Primary navigation" className="nav-links">
          <a href={LINKS.home}>Home</a>
          <a href={LINKS.hearth}>The Hearth</a>
          <a href={LINKS.demo}>Demo</a>
          <a className="live-pill" href="#pulse"><span className="status-dot" />LIVE ON MAINNET</a>
        </nav>
      </header>

      <main>
        <section className="hero-panel" id="hearth">
          <p className="eyebrow">THE ENDGAME</p>
          <h1>The burn has a finish line.</h1>
          <p className="hero-copy">$ASHEM burns toward a fixed floor of 300M — and then it stops, forever.<br />This is how far the fire has traveled.</p>
          <span className="status-badge"><span className="status-dot" />AWAITING THE FIRST BURN</span>

          <div className="timeline-wrap" aria-label="Burn progress timeline">
            <div className="timeline-line" />
            <div className="timeline-stages">
              {STAGES.map((stage) => (
                <div className={`timeline-stage ${stage.state}`} key={stage.label}>
                  <span className="stage-node" aria-hidden="true">{stage.state === 'done' ? '✓' : ''}</span>
                  <strong>{stage.label}</strong>
                  <span>{stage.detail}</span>
                  {stage.state === 'active' && <small>YOU ARE HERE</small>}
                </div>
              ))}
            </div>
          </div>

          <p className="hero-note">{pctText}% of the 700M burnable gone — the burn begins when the fee starts flowing (with trading). Every burn moves the marker toward the endgame.</p>
        </section>

        <div className="dashboard-grid">
          {/* Burn pulse */}
          <section className="dashboard-panel" id="pulse" aria-labelledby="pulse-title">
            <div className="panel-heading"><h2 id="pulse-title">Burn pulse</h2><span className="eyebrow">EVERY 6H</span></div>
            <div className="countdown-block"><p className="eyebrow">NEXT HARVEST IN</p><strong>{remaining}</strong></div>
            {burns && burns.length > 0 ? (
              <ul className="burn-list">
                {burns.map((b) => (
                  <li key={b.tx}>
                    <span className="fdot" />
                    <span><b>{b.amount.toLocaleString('en-US')}</b> ASHEM burned</span>
                    <a href={solscanTx(b.tx)} target="_blank" rel="noreferrer">{shortSig(b.tx)} ↗</a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-pulse">
                <span className="ember-glyph" aria-hidden="true" />
                <p>No burns yet — the guard runs every 6h and burns when there are fees to collect.<br />The first burn lands here the moment it happens.</p>
              </div>
            )}
          </section>

          {/* Proof wall */}
          <section className="dashboard-panel" id="proof" aria-labelledby="proof-title">
            <div className="panel-heading"><h2 id="proof-title">Proof wall</h2><span className="eyebrow">VERIFY · ON-CHAIN</span></div>
            <div className="proof-count"><span>{verifText}</span><p>verifications logged</p></div>
            <div className="proof-intro">
              {verifications ? 'Every check the community makes is counted here.' : 'Be the first — '}
              {!verifications && <a href={LINKS.discord} target="_blank" rel="noreferrer">run /verificar-mint in Discord</a>}
              {!verifications && '. Every check the community makes is counted here.'}
            </div>
            <p className="eyebrow proof-label">PROOF, ALREADY PUBLISHED</p>
            <ul className="proof-list">
              {PROOF_EVENTS.map((ev) => (
                <li key={ev.title}>
                  <span className="proof-dot" />
                  <span><b>{ev.title}</b> · {ev.detail}</span>
                  <a href={solscanTx(ev.sig)} target="_blank" rel="noreferrer" aria-label={`View proof for ${ev.title}`}>{shortSig(ev.sig)} ↗</a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Discord strip */}
        <section className="community-strip" aria-label="Discord community">
          <span className="discord-icon" aria-hidden="true">···</span>
          <div>
            <p><span className="online-dot" /> <b>{onlineText} online</b><span className="muted"> · Ash &amp; Ember | $ASHEM</span></p>
            <p className="muted">The team never DMs first. Verify, don&apos;t trust.</p>
          </div>
          <a className="join-button" href={LINKS.discord} target="_blank" rel="noreferrer">Join the server ↗</a>
        </section>
      </main>

      <footer>
        <nav aria-label="Footer navigation">
          <a href={LINKS.home}>Home</a>
          <a href={LINKS.demo}>Demo</a>
          <a href={LINKS.x} target="_blank" rel="noreferrer">X</a>
          <a href={LINKS.discord} target="_blank" rel="noreferrer">Discord</a>
          <a href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a>
          <a href={LINKS.terms}>Terms &amp; Risk</a>
        </nav>
        <p>$ASHEM · verifiable on-chain · we publish proof</p>
      </footer>
    </div>
  )
}
