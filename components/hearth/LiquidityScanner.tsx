'use client'

// The Hearth — Liquidity Risk Scanner.
// Default view = $ASHEM (honest empty state pre-liquidity). Users can paste any Solana
// pool address to scan it. Data via /api/hearth/liquidity (server-side GeckoTerminal proxy).

import { useCallback, useEffect, useState, type FormEvent } from 'react'

interface ScanResult {
  ok: boolean
  found: boolean
  mode?: 'ashem' | 'pool'
  reason?: string
  tokenName?: string
  poolAddress?: string
  reserveUsd?: number
  fdvUsd?: number
  priceUsd?: number
  volume24h?: number
  ratioPct?: number | null
  risk?: 'very-thin' | 'thin' | 'healthy' | 'nodata'
  veryLowAbsolute?: boolean
  logoUrl?: string | null
  symbol?: string | null
}

const RISK: Record<string, { icon: string; label: string; note: string }> = {
  healthy: { icon: '🟢', label: 'Healthy', note: 'Pool depth is solid relative to valuation.' },
  thin: { icon: '🟡', label: 'Thin', note: 'Modest liquidity vs valuation — expect meaningful slippage.' },
  'very-thin': { icon: '🔴', label: 'Very thin', note: 'Shallow pool vs valuation — small exits move price hard.' },
  nodata: { icon: '⚪', label: 'No data', note: 'Not enough data to score.' },
}

const REASONS: Record<string, string> = {
  'not-found': "No pool found for that address. Use a Solana pool (pair) address — not the token mint.",
  'invalid-address': "That doesn't look like a Solana address.",
  'too-fast': 'Too many scans — wait a second and try again.',
  'rate-limited': 'The data source is busy right now. Try again in a moment.',
  'upstream-error': "Couldn't reach the data source. Try again.",
  error: "Something went wrong. Try again.",
}

const fmtUsd = (n?: number) => {
  if (!n || n <= 0) return '—'
  return n >= 1000
    ? '$' + Math.round(n).toLocaleString('en-US')
    : '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
const fmtPrice = (n?: number) => {
  if (!n || n <= 0) return '—'
  return n < 0.01 ? '$' + n.toPrecision(2) : '$' + n.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

export default function LiquidityScanner() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [res, setRes] = useState<ScanResult | null>(null)

  const run = useCallback(async (pool?: string) => {
    setLoading(true)
    try {
      const url = pool ? `/api/hearth/liquidity?pool=${encodeURIComponent(pool)}` : '/api/hearth/liquidity'
      const j = (await (await fetch(url, { cache: 'no-store' })).json()) as ScanResult
      setRes(j)
    } catch {
      setRes({ ok: false, found: false, reason: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { run() }, [run]) // default = $ASHEM

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const v = input.trim()
    if (v) run(v)
  }
  const showAshem = () => { setInput(''); run() }

  const isAshem = res?.mode === 'ashem'
  const risk = res?.risk ? RISK[res.risk] : null
  const ratio = res?.ratioPct
  const barWidth = typeof ratio === 'number' ? Math.max(2, Math.min(100, (ratio / 10) * 100)) : 0

  return (
    <section className="dashboard-panel scanner-panel" id="liquidity" aria-labelledby="liq-title">
      <div className="panel-heading">
        <h2 id="liq-title">Liquidity Risk Scanner</h2>
        <span className="eyebrow">LIQUIDITY ÷ FDV</span>
      </div>
      <p className="scanner-sub">
        How deep is a pool relative to its valuation? Thin liquidity means small trades swing the
        price — a classic exit/rug risk. Check any Solana pool.
      </p>

      <form className="scanner-form" onSubmit={onSubmit}>
        <input
          type="text"
          inputMode="text"
          spellCheck={false}
          placeholder="Paste a Solana pool address…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Solana pool address"
        />
        <button type="submit" className="scan-btn" disabled={loading}>{loading ? 'Scanning…' : 'Scan'}</button>
        {res?.mode === 'pool' && (
          <button type="button" className="scan-reset" onClick={showAshem}>Show $ASHEM</button>
        )}
      </form>

      {loading ? (
        <div className="scanner-skeleton" aria-hidden="true"><span /><span /><span /></div>
      ) : res?.found ? (
        <div className="scanner-result">
          <div className="scanner-head">
            <div className="scanner-idn">
              {res.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="scanner-logo"
                  src={res.logoUrl}
                  alt=""
                  width={30}
                  height={30}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <span className="scanner-logo scanner-logo--ph" aria-hidden="true" />
              )}
              <span className="scanner-names">
                <span className="scanner-token">{res.tokenName}</span>
                {isAshem ? (
                  <span className="scanner-tag">official $ASHEM pool</span>
                ) : res.symbol ? (
                  <span className="scanner-tag">{res.symbol}</span>
                ) : null}
              </span>
            </div>
            {risk && <span className={`risk-badge risk-${res.risk}`}>{risk.icon} {risk.label}</span>}
          </div>

          {typeof ratio === 'number' && (
            <div className="ratio-bar" role="presentation"><span className={`risk-${res.risk}`} style={{ width: `${barWidth}%` }} /></div>
          )}

          <div className="scanner-metrics">
            <div><span className="eyebrow">LIQUIDITY ÷ FDV</span><strong>{typeof ratio === 'number' ? `${ratio.toFixed(2)}%` : '—'}</strong></div>
            <div><span className="eyebrow">LIQUIDITY</span><strong>{fmtUsd(res.reserveUsd)}</strong></div>
            <div><span className="eyebrow">FDV</span><strong>{fmtUsd(res.fdvUsd)}</strong></div>
            <div><span className="eyebrow">PRICE</span><strong>{fmtPrice(res.priceUsd)}</strong></div>
            <div><span className="eyebrow">VOLUME 24H</span><strong>{fmtUsd(res.volume24h)}</strong></div>
          </div>

          {res.veryLowAbsolute && (
            <p className="scanner-warn">⚠ Very low absolute liquidity — small trades move the price a lot, regardless of the ratio.</p>
          )}
          {risk && <p className="risk-note">{risk.note}</p>}
        </div>
      ) : isAshem && res?.reason === 'no-pool' ? (
        <div className="scanner-empty">
          <span className="ember-glyph" aria-hidden="true" />
          <p>No official $ASHEM pool exists yet. This reads live the moment liquidity opens.</p>
          <p className="scanner-warn">⚠ Any pool or presale claiming to be $ASHEM before then is fake — verify the mint:</p>
          <code className="scanner-mint">BGRvzRVpdPvzHQXPax5MqERsxZLprvWVTvUzpUUUhXot</code>
        </div>
      ) : (
        <div className="scanner-msg">{REASONS[res?.reason || 'error'] || REASONS.error}</div>
      )}

      <details className="scanner-guide">
        <summary>How to use</summary>
        <ol>
          <li>By default this shows the <strong>$ASHEM</strong> pool (or “no pool yet” before launch).</li>
          <li>To check any other token, paste a <strong>Solana pool (pair) address</strong> — not the token mint — and hit Scan.</li>
          <li>Read <strong>two things</strong>: the <strong>ratio</strong> (colored badge) and the <strong>absolute liquidity</strong> in USD — a $500 pool is shallow even if the ratio looks fine.</li>
          <li>Colors: 🟢 healthy · 🟡 thin · 🔴 very thin.</li>
          <li>Find a pool address on GeckoTerminal, Solscan, or your DEX — copy the pool (pair) address.</li>
        </ol>
      </details>

      <p className="scanner-disclaimer">
        Heuristic based on liquidity vs. fully-diluted valuation — not a full safety audit and not
        financial advice. One ratio can’t catch every risk. Always DYOR. ·{' '}
        <a href="https://www.geckoterminal.com" target="_blank" rel="noreferrer">Data by GeckoTerminal</a>
      </p>
    </section>
  )
}
