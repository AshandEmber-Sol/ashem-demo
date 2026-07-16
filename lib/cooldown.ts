import { Redis } from '@upstash/redis'

// Upstash Redis via the Vercel Marketplace integration, which injects
// KV_REST_API_URL / KV_REST_API_TOKEN. (Vercel KV was sunset in Dec 2024 and
// auto-migrated to Upstash.) If those aren't set (local dev / preview), we fall
// back to a best-effort in-memory cooldown that is NOT safe across instances.
const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

let memLast = 0 // in-memory fallback only (dev/preview without KV)

export type CooldownResult = { ok: true } | { ok: false; waitMs: number }

// Atomically claim a global cooldown slot for `ms`. Returns ok:true if the
// caller may proceed (it now holds the slot), or ok:false with the time left.
// Concurrent callers race on SET NX; exactly one wins.
export async function acquireCooldown(key: string, ms: number): Promise<CooldownResult> {
  if (redis) {
    const acquired = await redis.set(key, Date.now(), { nx: true, px: ms })
    if (acquired === 'OK') return { ok: true }
    const ttl = await redis.pttl(key)
    return { ok: false, waitMs: ttl > 0 ? ttl : ms }
  }
  const now = Date.now()
  if (now - memLast < ms) return { ok: false, waitMs: ms - (now - memLast) }
  memLast = now
  return { ok: true }
}

// Release a slot claimed by acquireCooldown — use when the guarded action
// failed and should be retryable immediately.
export async function releaseCooldown(key: string): Promise<void> {
  if (redis) await redis.del(key)
  else memLast = 0
}
