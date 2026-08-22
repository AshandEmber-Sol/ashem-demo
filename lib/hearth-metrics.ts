// The Hearth — community verification counter, backed by the project's Upstash Redis
// (the same instance used for the harvest cooldown: KV_REST_API_URL / KV_REST_API_TOKEN).
// Aggregate only — a total count + the last timestamp. NEVER who verified (no user IDs).

const URL = process.env.KV_REST_API_URL
const TOKEN = process.env.KV_REST_API_TOKEN

async function cmd(path: string): Promise<unknown> {
  if (!URL || !TOKEN) return null
  try {
    const r = await fetch(`${URL}/${path}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) return null
    return (await r.json())?.result ?? null
  } catch {
    return null
  }
}

/** Fire-and-forget: bump the aggregate verification counter. Called by the bot. */
export async function recordVerification(): Promise<void> {
  await cmd('incr/hearth:verifications:total')
  await cmd(`set/hearth:verifications:last/${Date.now()}`)
}

/** Read the counter for the Proof Wall. */
export async function getVerifications(): Promise<{ total: number; lastTs: number | null }> {
  const [total, last] = await Promise.all([
    cmd('get/hearth:verifications:total'),
    cmd('get/hearth:verifications:last'),
  ])
  return {
    total: total ? Number(total) : 0,
    lastTs: last ? Number(last) : null,
  }
}
