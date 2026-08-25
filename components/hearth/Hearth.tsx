'use client'

// The Hearth — reconciled from the v0 output.
// Changes vs v0: real deploy tx signatures + Solscan links (v0 hallucinated one),
// real official links, live data (verifications counter + Discord online + burns feed +
// endgame %), project fonts, and everything scoped under `.ashem-hearth` (see hearth.css).

import { useEffect, useState } from 'react'
import './hearth.css'
import LiquidityScanner from './LiquidityScanner'

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
            <div className="timeline-stages">
              <div className="timeline-line" />
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

        {/* Liquidity Risk Scanner */}
        <LiquidityScanner />

        {/* Discord strip */}
        <section className="community-strip" aria-label="Discord community">
          <span className="discord-icon" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
          </span>
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
