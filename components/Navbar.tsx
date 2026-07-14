'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
  { ssr: false }
)

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* ── Navbar ── */}
      <header
        className="w-full"
        style={{
          background: 'rgba(8,8,8,0.85)',
          backdropFilter: 'blur(24px) saturate(0.7)',
          borderBottom: '1px solid rgba(234,88,12,0.15)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(234,88,12,0.08)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Left – Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <img
                src="/mascot-round.png"
                alt="Ash & Ember mascot"
                className="h-9 w-9 crack-glow"
                style={{ filter: 'drop-shadow(0 0 12px rgba(234,88,12,0.65)) drop-shadow(0 0 4px rgba(251,191,36,0.3))' }}
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-tight">
                <span className="text-ember">ASH</span>
                <span className="text-muted mx-0.5">&amp;</span>
                <span style={{ color: 'var(--glow)', textShadow: '0 0 16px rgba(251,191,36,0.5)' }}>EMBER</span>
              </span>
              <span className="mono text-xs" style={{ color: 'rgba(234,88,12,0.7)' }}>$ASHEM</span>
            </div>
          </div>

          {/* Center – Network badge */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(28,33,43,0.92)',
              border: '1px solid rgba(159,176,201,0.18)',
              boxShadow: '0 0 12px rgba(0,0,0,0.35)',
            }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: '#22c55e',
                boxShadow: '0 0 6px rgba(34,197,94,0.8)',
                animation: 'ping 2s ease-in-out infinite',
              }}
            />
            <span className="mono text-xs font-medium" style={{ color: 'rgba(240,236,228,0.7)' }}>
              Solana Devnet
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-semibold"
              style={{
                background: 'rgba(159,176,201,0.15)',
                color: '#9fb0c9',
                fontSize: '0.65rem',
                letterSpacing: '0.06em',
              }}
            >
              TEST NETWORK
            </span>
          </div>

          {/* Right – Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: 'rgba(234,88,12,0.1)',
                border: '1px solid rgba(234,88,12,0.25)',
                color: 'rgba(240,236,228,0.85)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(234,88,12,0.2)'
                e.currentTarget.style.boxShadow = '0 0 16px rgba(234,88,12,0.25)'
                e.currentTarget.style.borderColor = 'rgba(234,88,12,0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(234,88,12,0.1)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'rgba(234,88,12,0.25)'
              }}
              aria-label="Open About Us panel"
            >
              About Us
            </button>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* ── About Us Drawer ── */}
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60]"
        style={{
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'opacity 0.35s ease',
        }}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-label="About Ash & Ember"
        className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-md overflow-y-auto"
        style={{
          background: 'linear-gradient(160deg, #12100d 0%, #0e0c0a 60%, #0a0806 100%)',
          borderLeft: '1px solid rgba(234,88,12,0.25)',
          boxShadow: drawerOpen ? '-20px 0 60px rgba(0,0,0,0.85), -4px 0 20px rgba(234,88,12,0.08)' : 'none',
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{
            background: 'rgba(234,88,12,0.12)',
            border: '1px solid rgba(234,88,12,0.25)',
            color: 'rgba(240,236,228,0.7)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234,88,12,0.25)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(234,88,12,0.12)' }}
          aria-label="Close About Us panel"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Hero area — transparent creature over dark gradient */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            height: 200,
            background: 'linear-gradient(150deg, #1a0e07 0%, #0e0804 100%)',
            borderBottom: '1px solid rgba(234,88,12,0.15)',
          }}
        >
          {/* Ember glow pool under creature */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 70% 115%, rgba(234,88,12,0.4) 0%, rgba(251,191,36,0.1) 40%, transparent 65%)',
            }}
          />
          {/* Creature — covers the full hero area like a background, anchored bottom-right */}
          <img
            src="/ash-ember-nobg.png"
            alt="Ash & Ember — volcanic creature sitting on glowing lava"
            className="absolute crack-glow"
            style={{
              right: 0,
              bottom: 0,
              width: '65%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'right bottom',
              filter:
                'drop-shadow(0 0 24px rgba(234,88,12,0.55)) drop-shadow(0 12px 24px rgba(0,0,0,0.8))',
            }}
          />
          {/* Left text over dark area */}
          <div className="absolute bottom-4 left-6" style={{ zIndex: 2 }}>
            <h2 className="text-2xl font-bold">
              <span className="text-ember">ASH</span>
              <span className="text-muted mx-1">&amp;</span>
              <span style={{ color: 'var(--glow)' }}>EMBER</span>
            </h2>
            <p className="mono text-xs mt-0.5" style={{ color: 'rgba(234,88,12,0.6)' }}>$ASHEM · Solana Devnet</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 flex flex-col gap-6 mt-2">

          {/* Mission card */}
          <div
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{
              background: 'rgba(26,18,12,0.8)',
              border: '1px solid rgba(234,88,12,0.15)',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-1 h-6 rounded-full"
                style={{ background: 'linear-gradient(to bottom, var(--accent), var(--glow))' }}
              />
              <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>Our Mission</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,236,228,0.75)' }}>
              <span className="text-ember font-semibold">$ASHEM</span> is a memecoin built on{' '}
              <span className="text-ember font-semibold">Solana&apos;s Token-2022 standard</span>, with an automated,
              on-chain burn-and-fee mechanism. This site is its{' '}
              <strong style={{ color: 'var(--text)' }}>devnet demo</strong> — a way to verify that mechanism
              yourself, on-chain and ahead of mainnet, without taking our word for it. Every interaction here —
              transfers, claims, harvests — is a real transaction on Solana Devnet.
            </p>
          </div>

          {/* Tech stack */}
          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-sm tracking-wider uppercase" style={{ color: 'var(--muted)' }}>
              Technical Stack
            </h3>
            {[
              { label: 'Token-2022', desc: 'Native transfer fee extension — 1.5% withheld on every transfer', icon: '⚡' },
              { label: 'Solana Devnet', desc: 'Real on-chain transactions, zero mainnet value or risk', icon: '🔗' },
              { label: 'GitHub Actions', desc: 'Harvest workflow runs the endgame.sh script — not a simulation', icon: '⚙' },
              { label: 'No Smart Contracts', desc: 'Interface calls Token-2022 native instructions only', icon: '🔐' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 px-4 py-3 rounded-lg"
                style={{
                  background: 'rgba(14,10,7,0.7)',
                  border: '1px solid rgba(234,88,12,0.1)',
                }}
              >
                <span className="text-base mt-0.5 flex-shrink-0">{item.icon}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{item.label}</div>
                  <div className="text-xs leading-relaxed mt-0.5" style={{ color: 'rgba(240,236,228,0.6)' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Mascot standing + caption */}
          <div className="flex items-end gap-4 mt-2">
            <img
              src="/mascot-standing.png"
              alt="Ash mascot — full body standing"
              className="h-28 flex-shrink-0 mascot-float"
              style={{
                width: 'auto',
                filter: 'drop-shadow(0 0 18px rgba(234,88,12,0.6)) drop-shadow(0 4px 12px rgba(0,0,0,0.7))',
              }}
            />
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,236,228,0.65)' }}>
              Born from the forge of Solana&apos;s devnet. Every crack in Ash&apos;s obsidian skin tells a story of tokens burned, fees harvested, and the chain kept honest.
            </p>
          </div>

          {/* Disclaimer */}
          <div
            className="rounded-lg px-4 py-3"
            style={{
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.2)',
            }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(248,113,113,0.85)' }}>
              <strong>Reminder:</strong> The $ASHEM tokens in this demo are devnet-only and have zero monetary value. Nothing here is financial advice, an allocation, or a mainnet token offering.
            </p>
          </div>
        </div>
      </aside>

      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
      `}</style>
    </>
  )
}