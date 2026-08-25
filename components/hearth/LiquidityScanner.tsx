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
  largeCap?: boolean
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
          {res.largeCap && (
            <p className="scanner-info">ℹ Large-cap token — its liquidity is spread across many pools and exchanges, so this single-pool ratio understates the real depth.</p>
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
        <a className="gt-attribution" href="https://www.geckoterminal.com" target="_blank" rel="noreferrer">
          <svg className="gt-logo" viewBox="0 0 104 105" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true">
            <path d="M72.7535 12.7C68.5956 5.28093 60.7657 0.629263 52.2622 0.485855V0.485855C43.4949 0.337999 35.306 5.0017 30.9971 12.6385L27.6079 18.6453C25.4524 22.4655 22.2873 25.6189 18.4592 27.7603L12.416 31.1407C4.94515 35.3196 0.279412 43.1746 0.183728 51.7343L0.174533 52.5569C0.0767894 61.3009 4.76162 69.4003 12.3898 73.6754L18.1745 76.9174C22.0155 79.07 25.1873 82.2418 27.34 86.0828L30.5819 91.8675C34.8571 99.4957 42.9565 104.181 51.7004 104.083L52.6102 104.073C61.1232 103.977 68.943 99.3616 73.1397 91.9544L76.8634 85.3822C79.026 81.5653 82.1972 78.4172 86.0298 76.2827L91.5028 73.2346C99.2042 68.9453 103.919 60.765 103.771 51.951V51.951C103.627 43.4482 98.9768 35.662 91.5584 31.5045L85.3806 28.0422C81.5396 25.8895 78.3678 22.7177 76.2152 18.8767L72.7535 12.7Z" fill="#7556F6" />
            <path d="M72.434 35.3464C69.3801 34.4571 66.2179 33.1922 63.0111 31.9176C62.8262 31.1085 62.1154 30.1004 60.6745 28.8644C58.5802 27.0344 54.6466 27.0825 51.2485 27.8916C47.4966 27.0023 43.7893 26.6844 40.2318 27.5448C11.1408 35.6193 27.1881 56.1735 16.5061 75.9728C31.3278 84.1555 29.6261 92.1506 57.3342 92.9274C57.3342 92.9274 50.4516 72.5983 68.7458 63.1786C83.5845 55.5407 94.3048 41.3566 72.4308 35.3432L72.434 35.3464Z" fill="#B7A2FF" />
            <path d="M82.6151 51.8587C76.0261 56.5365 68.5255 60.0841 57.8945 60.0841C52.9185 60.0841 51.908 54.7578 48.6183 57.368C46.9193 58.7164 40.9328 61.7311 36.1799 61.5032C31.3856 61.272 23.7319 58.466 21.5802 48.2533C21.7016 58.534 21.3892 67.4381 16.4965 75.9862C22.2309 76.7562 29.9242 91.7739 32.9589 95.3061C41.5044 105.253 49.1779 104.624 57.6453 103.52C55.8825 91.1178 67.5564 67.6738 73.6194 61.4582C75.9145 59.1049 80.3135 55.2619 82.6151 51.8587Z" fill="#B7A2FF" />
            <path d="M50.4665 27.8765C53.071 28.9175 62.5821 32.0853 66.6971 33.3288C62.4956 26.3573 56.1285 26.7596 50.4665 27.8765Z" fill="#AC94FF" />
            <path d="M53.2631 40.0689C53.2631 44.5957 49.6195 48.2621 45.1281 48.2621C40.6366 48.2621 36.9931 44.5957 36.9931 40.0689C36.9931 35.542 40.6366 31.8788 45.1281 31.8788C49.6195 31.8788 53.2631 35.5452 53.2631 40.0689Z" fill="white" />
            <ellipse cx="48.557" cy="40.0106" rx="4.77371" ry="6.6832" fill="black" />
            <path d="M48.5571 40.0097L42.8286 36.1908V43.8287L48.5571 40.0097Z" fill="white" />
          </svg>
          Data by GeckoTerminal
        </a>
      </p>
    </section>
  )
}
