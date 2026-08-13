// Ed25519 verification of incoming Discord interaction requests.
//
// NOT optional: without this, anyone who learns the endpoint URL could POST forged
// commands. Discord signs every request with its Ed25519 key pair; we verify against
// our app's public key. Requires the RAW request body (pre-JSON.parse) — the App
// Router gives us that via `await req.text()`.

import { verifyKey } from 'discord-interactions';

export async function isValidDiscordRequest(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  publicKey: string,
): Promise<boolean> {
  if (!signature || !timestamp) return false;
  try {
    // verifyKey is async in discord-interactions v4+ (uses Web Crypto).
    return await verifyKey(rawBody, signature, timestamp, publicKey);
  } catch {
    return false;
  }
}
