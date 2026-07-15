'use client'
import { useState, useEffect, useRef } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  vx: number
  vy: number
}

export function RiskDisclaimer({ onAcknowledge }: { onAcknowledge: () => void }) {
  const [visible, setVisible] = useState(true)
  const [exiting, setExiting] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const particleIdRef = useRef(0)

  // Spawn floating ash particles on the overlay
  useEffect(() => {
    const interval = setInterval(() => {
      const id = ++particleIdRef.current
      const p: Particle = {
        id,
        x: Math.random() * 100,
        y: 100 + Math.random() * 10,
        size: 2 + Math.random() * 4,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.2 + Math.random() * 0.4),
      }
      setParticles((prev) => [...prev.slice(-40), p])
      setTimeout(() => {
        setParticles((prev) => prev.filter((x) => x.id !== id))
      }, 6000)
    }, 180)
    return () => clearInterval(interval)
  }, [])

  function handleAck() {
    setExiting(true)
    // After animation, hide completely
    setTimeout(() => {
      setVisible(false)
      onAcknowledge()
    }, 900)
  }

  if (!visible) return null

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="disclaimer-title"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        transition: 'opacity 0.9s ease, backdrop-filter 0.9s ease',
        opacity: exiting ? 0 : 1,
      }}
    >
      {/* Dark ash overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(60,20,5,0.6) 0%, #050402 70%)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Ambient glow at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(159,176,201,0.18), transparent)',
        }}
      />

      {/* Floating ash particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full opacity-30"
            style={{
              left: `${p.x}%`,
              bottom: `${100 - p.y}%`,
              width: p.size,
              height: p.size,
              background: `rgba(${140 + Math.random() * 60}, ${50 + Math.random() * 40}, ${10 + Math.random() * 20}, 0.7)`,
              animation: `ashRise ${5 + Math.random() * 3}s ease-out forwards`,
              transform: `translateX(${p.vx * 200}px)`,
            }}
          />
        ))}
      </div>

      {/* Modal card */}
      <div
        className="relative z-10 mx-4 w-full max-w-lg"
        style={{
          transform: exiting ? 'scale(0.92) translateY(8px)' : 'scale(1) translateY(0)',
          transition: 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Slate border glow ring */}
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(159,176,201,0.7), rgba(159,176,201,0.4), rgba(220,38,38,0.6), rgba(159,176,201,0.7))',
            borderRadius: '1rem',
            padding: '1px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        {/* Animated border */}
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none"
          style={{
            borderRadius: '1rem',
            boxShadow: '0 0 24px rgba(159,176,201,0.55), 0 0 60px rgba(159,176,201,0.2), inset 0 0 30px rgba(159,176,201,0.05)',
            border: '1px solid rgba(159,176,201,0.5)',
            animation: 'borderPulse 2.5s ease-in-out infinite',
          }}
        />

        {/* Card body */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #1a100a 0%, #130d09 40%, #0e0a07 100%)',
            border: '1px solid rgba(159,176,201,0.25)',
          }}
        >
          {/* Top crack texture accent */}
          <div
            className="h-1 w-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(159,176,201,0.6) 30%, rgba(159,176,201,0.5) 50%, rgba(159,176,201,0.6) 70%, transparent 100%)',
              boxShadow: '0 0 12px rgba(159,176,201,0.5)',
            }}
          />

          <div className="p-8 flex flex-col gap-6">
            {/* Logo + mascot header */}
            <div className="flex flex-col items-center gap-3">
              <img
                src="/mascot-round.png"
                alt="Ash mascot"
                className="crack-glow"
                style={{
                  height: 88,
                  width: 'auto',
                }}
              />
              <div className="text-center">
                <h1 id="disclaimer-title" className="text-2xl font-bold tracking-tight">
                  <span className="text-ember">ASH</span>
                  <span className="text-muted mx-1">&amp;</span>
                  <span className="text-lava">EMBER</span>
                </h1>
                <p className="text-xs text-muted tracking-widest uppercase mt-1">$ASHEM — Solana Devnet</p>
              </div>
            </div>

            {/* Warning badge */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(220,38,38,0.12)',
                border: '1px solid rgba(220,38,38,0.3)',
              }}
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                <span className="text-white text-xs font-black">!</span>
              </div>
              <span className="text-red-400 text-xs font-semibold tracking-wide uppercase">Risk Disclaimer</span>
            </div>

            {/* Disclaimer text */}
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'rgba(240,236,228,0.85)' }}
            >
              <strong className="text-glow" style={{ color: 'var(--glow)' }}>WARNING:</strong>{' '}
              $ASHEM is a{' '}
              <strong className="text-ember">DEVNET Demo</strong>. Tokens have{' '}
              <strong className="text-red-400">ZERO mainnet value</strong>. Every action here triggers a real on-chain
              transaction on Solana Devnet. No custom smart contracts are used; this interface interacts
              directly with{' '}
              <span className="mono text-accent">Token-2022&apos;s</span> native instructions.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleAck}
              className="font-semibold w-full rounded-xl py-4 text-base relative overflow-hidden"
              style={{ letterSpacing: '0.1em', background: 'rgba(159,176,201,0.12)', border: '1px solid rgba(159,176,201,0.32)', color: '#e7ebf1' }}
            >
              {/* Inner shimmer */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)',
                  animation: 'shimmer 2.5s ease-in-out infinite',
                }}
              />
              <span className="relative">I ACKNOWLEDGE (ENTER)</span>
            </button>

            <p className="text-center text-xs text-muted">
              By entering, you confirm you understand this is a test network demonstration.
            </p>
          </div>

          {/* Bottom crack texture accent */}
          <div
            className="h-px w-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(159,176,201,0.3) 50%, transparent 100%)',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes borderPulse {
          0%, 100% { box-shadow: 0 0 24px rgba(159,176,201,0.55), 0 0 60px rgba(159,176,201,0.2), inset 0 0 30px rgba(159,176,201,0.05); }
          50% { box-shadow: 0 0 40px rgba(159,176,201,0.85), 0 0 90px rgba(159,176,201,0.35), inset 0 0 40px rgba(159,176,201,0.08); }
        }
        @keyframes ashRise {
          0% { transform: translateY(0) translateX(0); opacity: 0.35; }
          100% { transform: translateY(-180px) translateX(30px); opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}