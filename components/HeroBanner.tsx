export function HeroBanner() {
  return (
    <section
      className="relative w-full overflow-hidden"
      aria-label="Ash & Ember hero"
      style={{
        borderRadius: '1rem',
        height: 240,
        border: '1px solid rgba(234,88,12,0.22)',
        background: 'linear-gradient(130deg, #1a0e07 0%, #130a05 40%, #0c0704 100%)',
        boxShadow:
          '0 8px 48px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(234,88,12,0.1), inset 0 0 80px rgba(234,88,12,0.04)',
      }}
    >
      {/* Deep ambient lava glow pool at bottom-right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 78% 110%, rgba(234,88,12,0.35) 0%, rgba(251,191,36,0.08) 40%, transparent 65%)',
        }}
      />

      {/* Secondary left warm glow for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 70% at -5% 60%, rgba(180,40,0,0.14) 0%, transparent 55%)',
        }}
      />

      {/* Ash creature — transparent PNG, anchored bottom-right */}
      <img
        src="/ash-ember-nobg.png"
        alt="Ash, the volcanic mascot of Ash & Ember, sitting on a glowing lava mound"
        className="absolute crack-glow"
        style={{
          right: '-2%',
          bottom: '-8%',
          height: '115%',
          width: 'auto',
          filter:
            'drop-shadow(0 0 28px rgba(234,88,12,0.6)) drop-shadow(0 0 60px rgba(251,191,36,0.18)) drop-shadow(0 16px 32px rgba(0,0,0,0.7))',
          objectFit: 'contain',
          objectPosition: 'bottom right',
        }}
      />

      {/* Right fade so mascot blends into the dark edge */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, transparent 45%, rgba(12,7,4,0.55) 100%)',
        }}
      />

      {/* Content overlay — left side */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-5" style={{ maxWidth: '56%' }}>
        <div className="flex flex-col gap-1">
          {/* Network pill */}
          <div className="flex items-center gap-2 mb-1">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(8,6,4,0.8)',
                border: '1px solid rgba(234,88,12,0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: '#22c55e',
                  boxShadow: '0 0 5px rgba(34,197,94,0.9)',
                }}
              />
              <span
                className="mono text-xs font-semibold"
                style={{ color: 'rgba(240,236,228,0.8)', letterSpacing: '0.05em' }}
              >
                SOLANA DEVNET
              </span>
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-balance"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.9)' }}
          >
            <span style={{ color: 'var(--accent)' }}>ASH</span>
            <span style={{ color: 'rgba(240,236,228,0.35)', margin: '0 0.25em' }}>&amp;</span>
            <span style={{ color: 'var(--glow)', textShadow: '0 0 24px rgba(251,191,36,0.5)' }}>EMBER</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'rgba(240,236,228,0.6)', maxWidth: '28ch' }}
          >
            Token-2022 transfer fee demo &mdash; every crack in Ash&apos;s skin is a fee withheld on-chain.
          </p>
        </div>
      </div>

      {/* Top lava crack line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(234,88,12,0.7) 30%, rgba(251,191,36,0.5) 50%, rgba(234,88,12,0.7) 70%, transparent 100%)',
          boxShadow: '0 0 8px rgba(234,88,12,0.4)',
        }}
      />
    </section>
  )
}
