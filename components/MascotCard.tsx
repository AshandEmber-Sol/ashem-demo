export function MascotCard() {
  return (
    <section
      aria-label="Meet Ash"
      className="card-obsidian overflow-hidden"
      style={{ padding: 0 }}
    >
      <div className="flex flex-col sm:flex-row items-center">

        {/* ── Left: mascot portrait ── */}
        <div
          className="relative flex-shrink-0 flex items-center justify-center sm:w-52"
          style={{
            background: 'linear-gradient(160deg, #1a100a 0%, #110c08 100%)',
            minHeight: 220,
            borderRight: '1px solid rgba(234,88,12,0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Radial ember glow behind mascot */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 80% 70% at 50% 60%, rgba(234,88,12,0.2) 0%, rgba(251,191,36,0.05) 50%, transparent 75%)',
            }}
          />

          {/* Transparent mascot — floats over dark bg */}
          <img
            src="/mascot-standing.png"
            alt="Ash — full-body standing chibi volcanic creature with glowing orange lava cracks and a flame on its head"
            className="relative z-10 mascot-float"
            style={{
              height: 180,
              width: 'auto',
              filter: 'drop-shadow(0 0 18px rgba(234,88,12,0.55)) drop-shadow(0 8px 20px rgba(0,0,0,0.8))',
            }}
          />
        </div>

        {/* ── Right: intro (plain prose, not a stat card) ── */}
        <div className="flex-1 p-6 flex flex-col gap-3">
          <h2 className="text-xl font-black tracking-tight">
            <span style={{ color: 'var(--accent)' }}>ASH</span>
            <span
              className="text-sm font-normal ml-2"
              style={{ color: 'rgba(240,236,228,0.45)' }}
            >
              the Ember Keeper
            </span>
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'rgba(240,236,228,0.7)' }}
          >
            Born from the first block on devnet. Every transfer leaves a crack — every harvest seals one.
          </p>
        </div>
      </div>

      {/* Bottom lava crack accent */}
      <div
        className="h-px w-full"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(234,88,12,0.35) 40%, rgba(251,191,36,0.2) 50%, rgba(234,88,12,0.35) 60%, transparent 100%)',
        }}
      />
    </section>
  )
}