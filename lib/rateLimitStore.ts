// Store server-side del rate-limit. Impl local (archivo) para dev.
// En prod: swap a (a) KV externo o (b) historial on-chain.
import fs from 'fs'
import path from 'path'

const DIR = path.join(process.cwd(), '.data')
const FILE = path.join(DIR, 'claims.json')
type Claims = Record<string, number>

function read(): Claims {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf-8')) } catch { return {} }
}
function write(c: Claims) {
  fs.mkdirSync(DIR, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(c))
}
export function lastClaim(wallet: string): number | null {
  return read()[wallet] ?? null
}
export function recordClaim(wallet: string) {
  const c = read(); c[wallet] = Date.now(); write(c)
}
