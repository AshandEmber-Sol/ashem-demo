const STATS = [
  { label: 'Name',    value: 'Ash' },
  { label: 'Type',    value: 'Volcanic Entity' },
  { label: 'Network', value: 'Solana Devnet' },
  { label: 'Ability', value: '1.5% Fee Absorption' },
  { label: 'Token',   value: '$ASHEM / Token-2022' },
]

export function MascotCard() {
  return (
    <section
      aria-label="Meet Ash — character card"
      className="card-obsidian overflow-hidden"
      style={{ padding: 0 }}
    >
      <div className="flex flex-col sm:flex-row">

        {/* ── Left: character portrait ── */}
        <div
          className="relative flex-shrink-0 flex items-center justify-center sm:w-52"
          style={{
            background: 'linear-gradient(135deg, #f5f0e8 0%, #ede8de 50%, #e8e2d6 100%)',
            minHeight: 200,
            borderRight: '1px solid rgba(234,88,12,0.15)',
          }}
        >
          {/* Corner lava glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 105%, rgba(234,88,12,0.18) 0%, transparent 65%)',
            }}
          />

          <img
            src="/mascot-standing.jpg"
            alt="Ash — full-body standing chibi volcanic creature with glowing orange lava cracks and a flame on its head"
            className="relative z-10"
            style={{
              height: 168,
              width: 'auto',
              filter: 'drop-shadow(0 4px 12px rgba(234,88,12,0.35))',
            }}
          />

          {/* Card serial stamp bottom-left */}
          <div
            className="absolute bottom-2 left-3 mono text-xs font-bold"
            style={{ color: 'rgba(120,80,40,0.4)', letterSpacing: '0.08em' }}
          >
            #001
          </div>
        </div>

        {/* ── Right: stat block ── */}
        <div className="flex-1 p-5 flex flex-col justify-between gap-4">

          {/* Header */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold tracking-widest uppercase mono px-2 py-0.5 rounded"
                style={{
                  background: 'rgba(234,88,12,0.12)',
                  border: '1px solid rgba(234,88,12,0.25)',
                  color: 'var(--accent)',
                }}
              >
                Character
              </span>
              <span
                className="text-xs mono"
                style={{ color: 'rgba(240,236,228,0.3)' }}
              >
                · Volcanic Series
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight mt-1">
              <span style={{ color: 'var(--accent)' }}>ASH</span>
              <span
                className="text-sm font-normal ml-2"
                style={{ color: 'rgba(240,236,228,0.45)' }}
              >
                the Ember Keeper
              </span>
            </h2>
            <p
              className="text-xs leading-relaxed"
              style={{ color: 'rgba(240,236,228,0.55)', maxWidth: '38ch' }}
            >
              Born from the first block on devnet. Every transfer leaves a crack — every harvest seals one.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 gap-1.5">
            {STATS.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 px-3 py-1.5 rounded-lg"
                style={{
                  background: 'rgba(14,10,7,0.6)',
                  border: '1px solid rgba(234,88,12,0.08)',
                }}
              >
                <span
                  className="mono text-xs flex-shrink-0"
                  style={{ color: 'rgba(234,88,12,0.6)', letterSpacing: '0.05em' }}
                >
                  {label}
                </span>
                <span
                  className="text-xs font-semibold text-right"
                  style={{ color: 'rgba(240,236,228,0.8)' }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Footer rarity bar */}
          <div className="flex items-center gap-2">
            {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((tier, i) => (
              <div
                key={tier}
                className="h-1 flex-1 rounded-full transition-all"
                style={{
                  background:
                    i <= 2
                      ? 'var(--accent)'
                      : 'rgba(234,88,12,0.15)',
                  boxShadow: i <= 2 ? '0 0 4px rgba(234,88,12,0.5)' : 'none',
                }}
                title={tier}
              />
            ))}
            <span
              className="mono text-xs flex-shrink-0"
              style={{ color: 'rgba(234,88,12,0.5)' }}
            >
              RARE
            </span>
          </div>
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
