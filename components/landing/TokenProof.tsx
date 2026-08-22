'use client'

// $ASHEM mainnet landing — reconciled from the v0 output.
// Changes vs v0: real on-chain addresses/links (v0 hallucinated them), live data from
// /api/mainnet-state (supply + authorities, polled ~30s), the Ash mascot as the hero
// visual, real /demo + /terms wiring, copy fixes, and everything scoped under
// `.ashem-landing` so it never touches the project's global design system.
// CSS lives in ./landing.css (scoped). Uses the project's fonts via CSS vars.

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, ChevronRight, Copy, ExternalLink, Flame, TriangleAlert } from 'lucide-react'
import './landing.css'

type Tab = 'overview' | 'verify' | 'transparency'

// ── Real, public on-chain data (verified — see -ASHEM/docs/MAINNET-DEPLOY-LOG.md) ──
const MINT = 'BGRvzRVpdPvzHQXPax5MqERsxZLprvWVTvUzpUUUhXot'
const TREASURY = 'H6ejVfKrWGrGcb3hLgTtUy9Q3s1rDe7cm9pGhnBncge2'
const FEE_AUTH = 'DBj2zRbarj6J1DAnMmb47Wb1saEgLWPK8VFAuZCZFpmJ'
const LINKS = {
  website: 'https://ashem.xyz',
  demo: '/demo',
  x: 'https://x.com/ashembersol',
  discord: 'https://discord.gg/x2EXHsztxp',
  github: 'https://github.com/AshandEmber-Sol',
  repo: 'https://github.com/AshandEmber-Sol/-ASHEM',
  actions: 'https://github.com/AshandEmber-Sol/-ASHEM/actions',
  ledger: 'https://github.com/AshandEmber-Sol/-ASHEM/blob/main/state/harvest-ledger.csv',
  terms: '/terms',
}
const solscanToken = `https://solscan.io/token/${MINT}`
const solscanAcct = (a: string) => `https://solscan.io/account/${a}`
const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-5)}`
const fmt = (n: number) => n.toLocaleString('en-US')

interface LiveState {
  supply: number
  burned: number
  mintAuthority: string | null
  freezeAuthority: string | null
  feeAuthority: string | null
  ts: number
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={`Copy ${value}`}
      onClick={() => {
        navigator.clipboard?.writeText(value)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1200)
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  )
}

export default function TokenProof() {
  const [tab, setTab] = useState<Tab>('overview')
  const [openCheck, setOpenCheck] = useState<number | null>(null)
  const [live, setLive] = useState<LiveState | null>(null)
  const [failed, setFailed] = useState(false)
  const [, forceTick] = useState(0)

  // Live on-chain read: poll /api/mainnet-state every ~30s, update in place.
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const r = await fetch('/api/mainnet-state', { cache: 'no-store' })
        const j = await r.json()
        if (!alive) return
        if (j && j.ok === false) { setFailed(true); return }
        setLive({
          supply: j.supply, burned: j.burned,
          mintAuthority: j.mintAuthority, freezeAuthority: j.freezeAuthority,
          feeAuthority: j.feeAuthority, ts: j.ts ?? Date.now(),
        })
        setFailed(false)
      } catch {
        if (alive) setFailed(true)
      }
    }
    load()
    const poll = window.setInterval(load, 30000)
    const tick = window.setInterval(() => forceTick((t) => t + 1), 1000)
    return () => { alive = false; window.clearInterval(poll); window.clearInterval(tick) }
  }, [])

  const mintRevoked = live ? live.mintAuthority === null : true
  const freezeRevoked = live ? live.freezeAuthority === null : true
  const feeLive = live ? live.feeAuthority : FEE_AUTH
  const supplyText = live ? fmt(live.supply) : '1,000,000,000'
  const updatedAgo = live ? Math.max(0, Math.round((Date.now() - live.ts) / 1000)) : null

  const tabLabel = useMemo(
    () => (tab === 'overview' ? 'Overview' : tab === 'verify' ? 'Verify yourself' : 'Everything is open'),
    [tab],
  )

  // Verify rows — real addresses + Solscan.
  const rows: { name: string; value: string; addr?: string; note: string; link: string }[] = [
    { name: 'Mint address', value: short(MINT), addr: MINT,
      note: 'Owned by the canonical Token-2022 program — rules out fakes and clones.', link: solscanToken },
    { name: 'Mint & Freeze authority', value: (mintRevoked && freezeRevoked) ? 'None · revoked' : 'see Solscan',
      note: 'Both read null on-chain — nobody can mint new tokens or freeze yours.', link: solscanToken },
    { name: 'Fee-config & Withdraw', value: `Live · ${short(FEE_AUTH)}`, addr: FEE_AUTH,
      note: 'Intentionally still live on the hot key: the off-chain guard harvests and burns, and revokes these itself at end-of-life. Everything else is locked.', link: solscanAcct(FEE_AUTH) },
    { name: 'Treasury', value: short(TREASURY), addr: TREASURY,
      note: 'Public, cold. Audit its balance yourself any time.', link: solscanAcct(TREASURY) },
  ]

  return (
    <div className="ashem-landing site-shell">
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark"><Flame size={13} fill="currentColor" /></span> Ash &amp; Ember{' '}
          <span className="mono muted">$ASHEM</span>
        </a>
        <nav aria-label="Primary navigation">
          <button type="button" onClick={() => setTab('verify')}>Verify</button>
          <button type="button" onClick={() => setTab('transparency')}>Transparency</button>
          <a href="/hearth">The Hearth</a>
          <a href={LINKS.demo}>Demo</a>
          <span className="live-pill"><i /> LIVE ON MAINNET</span>
        </nav>
      </header>

      <main id="top" className="content">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">SOLANA TOKEN-2022 · DEFLATIONARY BURN</p>
            <h1>We don&apos;t ask<br />for trust.<br />We publish proof.</h1>
            <p className="lede">$ASHEM is a memecoin whose every mechanic — supply, fee, revoked authorities, the burn — is a record you can check on-chain. Not a claim to believe.</p>
            <div className="actions">
              <button type="button" className="button primary" onClick={() => setTab('verify')}>Verify yourself</button>
              <a className="button" href={LINKS.demo}>Open the devnet demo <ExternalLink size={13} /></a>
            </div>
          </div>
          <div className="flame-wrap" aria-hidden="true">
            <Image src="/ash-ember-nobg.png" alt="" width={300} height={300} className="hero-mascot" style={{ height: 'auto' }} priority />
          </div>
        </section>

        <div className="tabs" role="tablist" aria-label="Proof sections">
          {(['overview', 'verify', 'transparency'] as Tab[]).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>

        <section className="panel" aria-live="polite">
          <p className="eyebrow">{tab === 'overview' ? 'THE NUMBERS' : tab === 'verify' ? 'LIVE CHAIN READ' : 'PUBLIC LEDGER'}</p>
          <h2>{tabLabel}</h2>
          <p className="section-copy">{tab === 'overview' ? 'A fixed supply that only shrinks — toward a floor and no further.' : tab === 'verify' ? 'Read live from the chain right now. Status first — open any row for the exact address and how to check it.' : 'The scripts that burn, the logs of every run, the ledger of every split. Nothing runs that you can’t read.'}</p>

          {tab === 'overview' && (
            <>
              <div className="metrics">
                <Metric label="TOTAL SUPPLY" value="1,000,000,000" note="Fixed cap · mint authority revoked" />
                <Metric label="BURNABLE" value="700,000,000" note="70% of supply, burned over time" />
                <Metric label="BURN FLOOR" value="300,000,000" note="30% — the burn stops here" />
              </div>
              <div className="token-meta">
                <span>Transfer fee <b>1.5%</b></span>
                <span>Max fee <b>uncapped</b></span>
                <span>Split <b>2/3 burn · 1/3 dev</b></span>
                <span>Decimals <b>9</b></span>
                <span>Program <b>Token-2022</b></span>
              </div>
              <h3>How the burn works</h3>
              <div className="steps">
                {[
                  ['STEP 01', 'Fee withheld', 'Every transfer retains 1.5% on-chain.'],
                  ['STEP 02', 'Harvest · 6h', 'A public workflow collects the withheld fees.'],
                  ['STEP 03', 'Split', '2/3 is burned, 1/3 goes to the dev wallet.'],
                  ['STEP 04', 'Endgame', 'At the floor: fee off, authorities revoked, proof published.'],
                ].map(([ey, title, copy]) => (
                  <div className="step" key={ey}><span className="step-dot" /><p className="eyebrow">{ey}</p><h4>{title}</h4><p>{copy}</p></div>
                ))}
              </div>
            </>
          )}

          {tab === 'verify' && (
            <>
              <div className="status-grid">
                <Status title="MINT AUTHORITY" value={mintRevoked ? 'Revoked' : 'Live'} good={mintRevoked} />
                <Status title="FREEZE AUTHORITY" value={freezeRevoked ? 'Revoked' : 'Live'} good={freezeRevoked} />
                <Status title="FEE AUTHORITY" value="Live · by design" />
                <Status title="SUPPLY · LIVE" value={supplyText} />
              </div>
              <p className="live-note">
                {failed ? 'Live read unavailable — verify directly on Solscan.' : updatedAgo === null ? 'Reading the chain…' : `Updated ${updatedAgo}s ago · read live from the chain`}
              </p>
              <div className="check-list">
                {rows.map((row, index) => (
                  <div className="check-row" key={row.name}>
                    <button type="button" onClick={() => setOpenCheck(openCheck === index ? null : index)} aria-expanded={openCheck === index}>
                      <span>{row.name}</span>
                      <span className="mono muted">{row.value}</span>
                      <ChevronRight size={15} className={openCheck === index ? 'rotate' : ''} />
                    </button>
                    {openCheck === index && (
                      <div className="check-detail">
                        {row.addr && (
                          <div className="addr-line">
                            <span className="mono">{row.addr}</span>
                            <CopyButton value={row.addr} />
                          </div>
                        )}
                        <p>{row.note}</p>
                        <a href={row.link} target="_blank" rel="noreferrer">View on Solscan <ExternalLink size={12} /></a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'transparency' && (
            <>
              <a className="source-card" href={LINKS.repo} target="_blank" rel="noreferrer">
                <p className="eyebrow">THE SOURCE OF TRUTH</p>
                <h3>Source code</h3>
                <p>The full endgame state machine and the burn workflow live on GitHub — public, and the same code that runs in production.</p>
                <span>github.com/AshandEmber-Sol <ExternalLink size={13} /></span>
              </a>
              <div className="transparency-grid">
                <a className="mini-card" href={LINKS.actions} target="_blank" rel="noreferrer"><h4>Burn workflow</h4><p>Runs every 6h. Public run history, logs open.</p><span>GitHub Actions →</span></a>
                <a className="mini-card" href={LINKS.ledger} target="_blank" rel="noreferrer"><h4>Harvest ledger</h4><p>Every split: burned, sent to dev, with signatures.</p><span>harvest-ledger.csv →</span></a>
                <a className="mini-card" href={LINKS.discord} target="_blank" rel="noreferrer"><h4>Verify in Discord</h4><p><span className="mono">/verificar-mint · /supply · /contrato</span></p><span>Join the server →</span></a>
              </div>
            </>
          )}
        </section>

        <section className="links-section" id="links">
          <p className="eyebrow">OFFICIAL LINKS · THE ONLY ONES</p>
          <div className="link-row">
            <a href={LINKS.website}>ashem.xyz</a>
            <a href={LINKS.demo}>Devnet demo</a>
            <a href={LINKS.x} target="_blank" rel="noreferrer">X · @ashembersol</a>
            <a href={LINKS.discord} target="_blank" rel="noreferrer">Discord</a>
            <a href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <p className="fine-print">Anything not on this list is not us. Report impostors with /reportar-scam in Discord.</p>
        </section>

        <section className="safety">
          <p className="eyebrow">STAYING SAFE</p>
          <div>
            <p>The team will never DM you first.</p>
            <p>No staking, no whitelist, no “connect wallet” outside the official demo.</p>
          </div>
          <div>
            <p>We will never ask for your seed phrase or private key.</p>
            <p>When in doubt, don&apos;t sign. Verify the mint before interacting.</p>
          </div>
        </section>

        <section className="cta">
          <div>
            <h3>See the mechanism work — with zero risk</h3>
            <p>The devnet demo lets anyone trigger a real fee, harvest, and burn on Solana devnet. Test tokens, zero value.</p>
          </div>
          <a className="button primary" href={LINKS.demo}>Open the devnet demo <ExternalLink size={13} /></a>
        </section>

        <aside className="warning">
          <TriangleAlert size={14} />
          <span><b>Not financial advice.</b> $ASHEM is a high-risk memecoin — the value can go to zero and you can lose everything you put in. Deflationary supply is a mechanic, not a promise of price. Read the full <a href={LINKS.terms}>Terms &amp; Risk Disclaimer</a> before doing anything.</span>
        </aside>
      </main>
    </div>
  )
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="metric"><p className="eyebrow">{label}</p><strong>{value}</strong><p>{note}</p></div>
}
function Status({ title, value, good = false }: { title: string; value: string; good?: boolean }) {
  return <div className="status"><p className="eyebrow">{title}</p><span className={good ? 'good' : 'orange'}><i /> {value}</span></div>
}
