// $ASHEM mainnet landing — live on-chain state for the landing page.
//
// Read-only. Reads supply + authorities from the chain via lib/ashem/solana.ts (the
// same logic the Discord bot uses) using ASHEM_RPC_URL (Helius) SERVER-SIDE — the key
// never reaches the browser. A small in-process cache means all visitors in this
// instance share ONE read per ~30s window, so trading traffic doesn't burn the Helius
// free tier. The client polls this route every ~30s.

import { NextResponse } from 'next/server';
import { getTokenSupply, getMintInfo } from '../../../lib/ashem/solana';
import { MINT, INITIAL_SUPPLY } from '../../../lib/ashem/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL_MS = 30_000;
let cache: { ts: number; body: Record<string, unknown> } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL_MS) {
    return NextResponse.json(cache.body);
  }
  try {
    const [supply, mint] = await Promise.all([getTokenSupply(MINT), getMintInfo(MINT)]);
    const body = {
      ok: true,
      supply: supply.ui,
      burned: INITIAL_SUPPLY - supply.ui,
      mintAuthority: mint.mintAuthority, // null = revoked
      freezeAuthority: mint.freezeAuthority, // null = revoked
      feeAuthority: mint.transferFee?.transferFeeConfigAuthority ?? null, // live by design
      ts: Date.now(),
    };
    cache = { ts: Date.now(), body };
    return NextResponse.json(body);
  } catch (e) {
    // Serve stale data if we have any; otherwise let the client degrade to Solscan links.
    if (cache) return NextResponse.json({ ...cache.body, stale: true });
    return NextResponse.json(
      { ok: false, error: String((e as Error)?.message ?? e) },
      { status: 502 },
    );
  }
}
