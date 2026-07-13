'use client'
import { useState, useEffect, useRef } from 'react'

type TerminalStage = 'idle' | 'queued' | 'running' | 'harvesting' | 'burning' | 'success' | 'failed'

const STAGE_LABELS: Record<TerminalStage, string> = {
  idle: '> Awaiting ignition…',
  queued: '> [QUEUED] Workflow dispatched to GitHub Actions…',
  running: '> [RUNNING] Executing endgame.sh on runner…',
  harvesting: '> [HARVESTING] Collecting withheld fees from Token-2022 vault…',
  burning: '> [BURNING 2/3] Sending tokens to the null address… 🔥',
  success: '> [SUCCESS] Harvest complete. Magma level updated.',
  failed: '> [FAILED] Workflow did not complete. Check GitHub Actions.',
}

const STAGE_COLORS: Record<TerminalStage, string> = {
  idle: 'rgba(240,236,228,0.45)',
  queued: 'rgba(251,191,36,0.8)',
  running: 'rgba(234,88,12,0.9)',
  harvesting: 'rgba(251,191,36,0.9)',
  burning: 'rgba(239,68,68,0.9)',
  success: 'rgba(34,197,94,0.9)',
  failed: 'rgba(239,68,68,0.7)',
}

interface HarvestButtonProps {
  onErupt?: () => void
}

export function HarvestButton({ onErupt }: HarvestButtonProps) {
  const [stage, setStage] = useState<TerminalStage>('idle')
  const [runUrl, setRunUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [terminalLog, setTerminalLog] = useState<{ text: string; color: string; ts: string }[]>([])
  const [erupting, setErupting] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  function addLog(stage: TerminalStage) {
    const now = new Date().toISOString().split('T')[1].slice(0, 8)
    setTerminalLog((prev) => [
      ...prev,
      { text: STAGE_LABELS[stage], color: STAGE_COLORS[stage], ts: now },
    ])
    setTimeout(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
    }, 50)
  }

  async function harvest() {
    setError(null); setRunUrl(null)
    setTerminalLog([])
    setLoading(true)
    setStage('queued')
    addLog('queued')

    try {
      const res = await fetch('/api/harvest', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError((data.error || 'failed') + (data.detail ? `: ${data.detail}` : ''))
        setStage('failed')
        addLog('failed')
        return
      }
      setRunUrl(data.runUrl)
      if (!data.runId) {
        setStage('running')
        addLog('running')
        return
      }

      setStage('running')
      addLog('running')

      // Simulate intermediate stages during polling
      let harvestingShown = false
      let burningShown = false

      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 5000))

        if (i === 3 && !harvestingShown) {
          setStage('harvesting')
          addLog('harvesting')
          harvestingShown = true
        }
        if (i === 7 && !burningShown) {
          setStage('burning')
          addLog('burning')
          burningShown = true
        }

        const r = await fetch(`/api/harvest-status?runId=${data.runId}`)
        const s = await r.json()

        if (s.status === 'completed') {
          if (s.conclusion === 'success') {
            if (!harvestingShown) { setStage('harvesting'); addLog('harvesting') }
            if (!burningShown) { setStage('burning'); addLog('burning') }
            await new Promise((r) => setTimeout(r, 800))
            setStage('success')
            addLog('success')
            // Trigger eruption effect
            setErupting(true)
            onErupt?.()
            setTimeout(() => setErupting(false), 2000)
          } else {
            setStage('failed')
            addLog('failed')
          }
          return
        }
      }

      setStage('running')
      addLog({ text: '> [TIMEOUT] Still running — check GitHub Actions for result.', color: STAGE_COLORS.running } as any)
    } catch (e: any) {
      setError(String(e?.message ?? e))
      setStage('failed')
      addLog('failed')
    } finally {
      setLoading(false)
    }
  }

  const isDone = stage === 'success' || stage === 'failed'

  return (
    <section
      className="card-obsidian p-6 flex flex-col gap-5 relative overflow-hidden"
      aria-label="Harvest and burn engine"
    >
      {/* Eruption flash overlay */}
      {erupting && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none z-20"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.35) 0%, rgba(234,88,12,0.4) 40%, transparent 70%)',
            animation: 'eruptionFlash 1.2s ease-out forwards',
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: loading ? 'rgba(234,88,12,0.25)' : 'rgba(234,88,12,0.15)',
            border: '1px solid rgba(234,88,12,0.25)',
            boxShadow: loading ? '0 0 16px rgba(234,88,12,0.4)' : 'none',
            transition: 'all 0.3s',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 2c0 6-8 9-8 14a8 8 0 0 0 16 0c0-5-8-8-8-14z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold">
            Harvest &amp; Burn{' '}
            <span className="text-muted font-normal text-sm">(runs the real engine)</span>
          </h2>
          <p className="text-xs text-muted">Triggers the GitHub Actions workflow — endgame.sh, not a simulation</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,236,228,0.7)' }}>
        Triggers the same workflow that runs in production: collects withheld fees from the Token-2022 vault,{' '}
        <span className="text-red-400 font-semibold">burns 2/3</span> to a null address, and sends 1/3 to the dev wallet.
        Takes ~30–60 seconds. If no fees are withheld, supply won&apos;t change.
      </p>

      {/* Giant pulsing HARVEST NOW button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={harvest}
          disabled={loading}
          className="btn-fire relative overflow-hidden rounded-2xl"
          style={{
            padding: '1.25rem 3rem',
            fontSize: '1.1rem',
            letterSpacing: '0.12em',
            fontWeight: 800,
            width: '100%',
            maxWidth: 400,
            animation: !loading ? 'emberPulse 2.4s ease-in-out infinite' : 'none',
            boxShadow: loading
              ? '0 0 60px rgba(234,88,12,0.6), 0 0 120px rgba(234,88,12,0.25)'
              : '0 0 24px rgba(234,88,12,0.5), 0 0 48px rgba(234,88,12,0.2)',
          }}
        >
          {/* Background lava shimmer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.12) 50%, transparent 100%)',
              animation: loading ? 'shimmerFast 1s ease-in-out infinite' : 'shimmer 3s ease-in-out infinite',
            }}
          />

          {/* Flame particles */}
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: `${15 + i * 14}%`,
                bottom: '0',
                width: 3,
                height: 3,
                background: 'var(--glow)',
                borderRadius: '50%',
                animation: `particleRise ${0.6 + i * 0.15}s ease-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}

          <span className="relative flex items-center justify-center gap-3">
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                HARVESTING…
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2c0 6-8 9-8 14a8 8 0 0 0 16 0c0-5-8-8-8-14z" />
                </svg>
                HARVEST NOW
              </>
            )}
          </span>
        </button>

        {/* Stage indicator dots */}
        <div className="flex items-center gap-2">
          {(['queued', 'running', 'harvesting', 'burning', 'success'] as TerminalStage[]).map((s) => {
            const reached = ['queued', 'running', 'harvesting', 'burning', 'success'].indexOf(s) <=
              ['queued', 'running', 'harvesting', 'burning', 'success'].indexOf(stage)
            const current = stage === s
            return (
              <div
                key={s}
                className="rounded-full transition-all duration-500"
                style={{
                  width: current ? 24 : 6,
                  height: 6,
                  background: stage === 'failed'
                    ? 'rgba(239,68,68,0.5)'
                    : reached
                    ? (s === 'success' ? 'rgba(34,197,94,0.9)' : 'var(--accent)')
                    : 'rgba(234,88,12,0.2)',
                  boxShadow: current ? `0 0 8px ${STAGE_COLORS[s]}` : 'none',
                }}
                title={s}
              />
            )
          })}
        </div>
      </div>

      {/* Terminal log */}
      {terminalLog.length > 0 && (
        <div
          ref={logRef}
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(4,3,2,0.95)',
            border: '1px solid rgba(234,88,12,0.2)',
            maxHeight: 160,
            overflowY: 'auto',
          }}
        >
          {/* Terminal header bar */}
          <div
            className="flex items-center gap-2 px-4 py-2 border-b"
            style={{ borderColor: 'rgba(234,88,12,0.15)', background: 'rgba(10,6,4,0.8)' }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="mono text-xs ml-2" style={{ color: 'rgba(234,88,12,0.6)' }}>
              ashem — endgame.sh
            </span>
            {loading && (
              <div
                className="ml-auto w-2 h-2 rounded-full"
                style={{
                  background: 'var(--accent)',
                  animation: 'liveIndicator 1s ease-in-out infinite',
                }}
              />
            )}
          </div>

          {/* Log lines */}
          <div className="p-3 flex flex-col gap-1">
            {terminalLog.map((line, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mono text-xs flex-shrink-0" style={{ color: 'rgba(234,88,12,0.35)' }}>
                  {line.ts}
                </span>
                <span
                  className="mono text-xs leading-relaxed"
                  style={{
                    color: line.color,
                    textShadow: `0 0 8px ${line.color.replace('0.9', '0.4').replace('0.8', '0.3')}`,
                  }}
                >
                  {line.text}
                </span>
              </div>
            ))}
            {/* Blinking cursor */}
            {loading && (
              <div className="flex items-center gap-2">
                <span className="mono text-xs" style={{ color: 'rgba(234,88,12,0.35)' }}>
                  {new Date().toISOString().split('T')[1].slice(0, 8)}
                </span>
                <span
                  className="mono text-xs"
                  style={{
                    color: 'var(--accent)',
                    animation: 'blink 1s step-end infinite',
                  }}
                >
                  █
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Links & errors */}
      {runUrl && (
        <a
          className="text-sm text-accent underline underline-offset-2 self-start"
          href={runUrl}
          target="_blank"
          rel="noreferrer"
        >
          View the run on GitHub Actions &rarr;
        </a>
      )}
      {error && (
        <p className="text-red-400 text-sm mono px-3 py-2 rounded-lg" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>
          {error}
        </p>
      )}
      {stage === 'success' && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
          }}
        >
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="text-sm text-green-400">
            Harvest complete. The Magma Tank above refreshes automatically.
          </p>
        </div>
      )}

      <style>{`
        @keyframes particleRise {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-40px) scale(0); opacity: 0; }
        }
        @keyframes shimmerFast {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </section>
  )
}
