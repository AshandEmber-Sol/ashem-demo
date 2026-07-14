const MINT = process.env.NEXT_PUBLIC_ASHEM_MINT ?? ''
const GITHUB_URL = 'https://github.com/AshandEmber-Sol/ashem-demo'
const SOLSCAN_URL = `https://solscan.io/token/${MINT}?cluster=devnet`

const linkStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'var(--text)',
}

function ExternalArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(240,236,228,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  )
}

export function VerifyBar() {
  return (
    <section
      aria-label="Verify on-chain"
      className="card-obsidian p-5 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <div className="flex items-start gap-3 flex-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(159,176,201,0.12)', border: '1px solid rgba(159,176,201,0.25)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9fb0c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2l7 4v6c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-4z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,236,228,0.75)' }}>
          This interface has <strong style={{ color: 'var(--text)' }}>no smart contract of its own</strong>. It only calls Token-2022&apos;s native instructions directly — inspect every call yourself:
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <a href={GITHUB_URL} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:brightness-125"
          style={linkStyle}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
          <ExternalArrow />
        </a>

        <a href={SOLSCAN_URL} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:brightness-125"
          style={linkStyle}>
          <img src="https://solscan.io/favicon.ico" alt="" width={16} height={16} style={{ borderRadius: 3 }} />
          Solscan
          <ExternalArrow />
        </a>
      </div>
    </section>
  )
}