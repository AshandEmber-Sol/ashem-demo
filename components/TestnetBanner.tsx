export function TestnetBanner() {
  return (
    <div
      role="status"
      aria-label="Network status — Solana Devnet test network"
      className="flex items-center justify-center gap-2 px-4 py-1.5 text-center"
      style={{
        background: 'rgba(28,33,43,0.92)',
        borderBottom: '1px solid rgba(159,176,201,0.18)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: '#c3c9d4',
        fontSize: '12.5px',
        fontWeight: 500,
        lineHeight: 1.3,
      }}
    >
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
        style={{ color: '#9fb0c9', flex: 'none' }}
      >
        <path d="M12 3.5 22 20H2L12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M12 10v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
      </svg>
      <span>
        <b style={{ fontWeight: 700, color: '#e7ebf1' }}>Solana Devnet</b>
        {' '}— test network. Nothing here has value or any relationship to mainnet.
      </span>
    </div>
  )
}