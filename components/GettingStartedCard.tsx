export function GettingStartedCard() {
  return (
    <section className="card-obsidian p-6 flex flex-col gap-4" aria-label="Getting started">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(234,88,12,0.15)', border: '1px solid rgba(234,88,12,0.25)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold">New here? Start in 3 steps</h2>
          <p className="text-xs text-muted">Takes about a minute</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { n: 1, title: 'Get a wallet', desc: 'Phantom or Solflare — free browser extension.' },
          { n: 2, title: 'Switch to Devnet', desc: "In your wallet's settings, change the network from Mainnet." },
          { n: 3, title: 'Connect & claim', desc: 'Hit "Select Wallet" above, then claim test funds below.' },
        ].map((step) => (
          <div
            key={step.n}
            className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
            style={{ background: 'rgba(14,10,7,0.7)', border: '1px solid rgba(234,88,12,0.1)' }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mono text-xs font-bold mt-0.5"
              style={{ background: 'rgba(234,88,12,0.15)', color: 'var(--accent)' }}
            >
              {step.n}
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{step.title}</div>
              <div className="text-xs leading-relaxed mt-0.5" style={{ color: 'rgba(240,236,228,0.55)' }}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted">
        Full step-by-step guide (with exact wallet menus): tap{' '}
        <strong style={{ color: 'var(--text)' }}>How to Use</strong> in the top bar.
      </p>
    </section>
  )
}