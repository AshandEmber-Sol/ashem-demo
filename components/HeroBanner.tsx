export function HeroBanner() {
  return (
    <section
      className="relative w-full overflow-hidden"
      aria-label="Ash & Ember hero"
      style={{
        borderRadius: '1rem',
        height: 240,
        border: '1px solid rgba(234,88,12,0.2)',
        boxShadow: '0 8px 48px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(234,88,12,0.1)',
      }}
    >
      {/* Banner image */}
      <img
        src="/ash-ember-banner.png"
        alt="Ash, the volcanic mascot of Ash & Ember, sitting on a glowing lava mound surrounded by ember sparks"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'center 25%' }}
      />

      {/* Bottom fade to page bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 55%, rgba(8,6,4,0.97) 100%)',
        }}
      />

      {/* Left side vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(8,6,4,0.75) 0%, transparent 45%)',
        }}
      />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-5">
        <div className="flex flex-col gap-1">
          {/* Network pill */}
          <div className="flex items-center gap-2 mb-1">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(8,6,4,0.75)',
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
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.8)' }}
          >
            <span style={{ color: 'var(--accent)' }}>ASH</span>
            <span style={{ color: 'rgba(240,236,228,0.45)', margin: '0 0.25em' }}>&amp;</span>
            <span style={{ color: 'var(--glow)', textShadow: '0 0 24px rgba(251,191,36,0.5)' }}>EMBER</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'rgba(240,236,228,0.65)', maxWidth: '30ch' }}
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
