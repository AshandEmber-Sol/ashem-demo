// $ASHEM — live buy/sell tracker → Discord.
//
// A Helius Enhanced Webhook (type "Enhanced", filtered to SWAP transactions on the
// Raydium pool's accounts) POSTs here every time someone trades $ASHEM. This endpoint
// turns each swap into an on-brand embed and posts it to a channel — no third-party
// "buy bot" involved, no extra permissions granted to anyone else's app.
//
// Brand rule, same as the rest of the bot: every number quoted is derived from the
// webhook payload itself (which Helius sources from the on-chain transaction) plus one
// live RPC call for supply/market cap — nothing is invented, nothing is cached beyond
// this request. If SOL/USD can't be fetched, the embed still posts, just without USD.
//
// Auth: Helius lets you set a custom "Authentication Header" value when you create the
// webhook. Compare it here in constant time — same pattern as COWORK_PUBLISH_SECRET.

import { NextRequest, NextResponse } from 'next/server';
import { postMessage, type Embed } from '../../../../../lib/discord/rest';
import { MINT, VERIFY_TAGLINE, solscanToken, optionalEnv } from '../../../../../lib/ashem/config';
import { getTokenSupply, fmt } from '../../../../../lib/ashem/solana';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WSOL_MINT = 'So11111111111111111111111111111111111111112';
const BUY_COLOR = 0x22c55e; // green
const SELL_COLOR = 0xef4444; // red
const FOOTER = { text: VERIFY_TAGLINE };

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function shortAddr(addr: string): string {
  return addr.length > 10 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;
}

// Best-effort SOL/USD price. Never throws — a failure just means the embed skips the
// USD line. Uses Jupiter's public price endpoint (no API key required).
async function getSolUsdPrice(): Promise<number | null> {
  try {
    const res = await fetch('https://price.jup.ag/v6/price?ids=SOL', {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Record<string, { price?: number }> };
    return json.data?.SOL?.price ?? null;
  } catch {
    return null;
  }
}

interface HeliusTokenLeg {
  userAccount?: string;
  tokenAmount?: number | string;
  mint?: string;
}

interface HeliusSwapEvent {
  nativeInput?: { account?: string; amount?: string | number } | null;
  nativeOutput?: { account?: string; amount?: string | number } | null;
  tokenInputs?: HeliusTokenLeg[];
  tokenOutputs?: HeliusTokenLeg[];
}

interface HeliusEnhancedTx {
  signature?: string;
  type?: string;
  feePayer?: string;
  events?: { swap?: HeliusSwapEvent };
}

interface ParsedSwap {
  direction: 'buy' | 'sell';
  trader: string;
  ashemAmount: number;
  solAmount: number;
  signature: string;
}

/** Pull the $ASHEM leg + the SOL leg out of a Helius swap event. Returns null if this
 *  swap doesn't touch $ASHEM at all (webhook should already be scoped, but don't trust
 *  that blindly — re-verify here, same "verify, don't trust" rule as everywhere else). */
function parseSwap(tx: HeliusEnhancedTx): ParsedSwap | null {
  const swap = tx.events?.swap;
  if (!swap) return null;

  const inputs = swap.tokenInputs ?? [];
  const outputs = swap.tokenOutputs ?? [];

  const ashemIn = inputs.find((t) => t.mint === MINT);
  const ashemOut = outputs.find((t) => t.mint === MINT);
  if (!ashemIn && !ashemOut) return null; // not an $ASHEM swap

  const direction: 'buy' | 'sell' = ashemOut ? 'buy' : 'sell';
  const ashemLeg = ashemOut ?? ashemIn!;
  const ashemAmount = Math.abs(Number(ashemLeg.tokenAmount ?? 0));

  // SOL side: prefer the native SOL leg (real SOL); fall back to a WSOL token leg
  // (Raydium CPMM usually trades against wrapped SOL token accounts, not native).
  let solAmount = 0;
  if (direction === 'buy') {
    if (swap.nativeInput) solAmount = Number(swap.nativeInput.amount ?? 0) / 1e9;
    else solAmount = Math.abs(Number(inputs.find((t) => t.mint === WSOL_MINT)?.tokenAmount ?? 0));
  } else {
    if (swap.nativeOutput) solAmount = Number(swap.nativeOutput.amount ?? 0) / 1e9;
    else solAmount = Math.abs(Number(outputs.find((t) => t.mint === WSOL_MINT)?.tokenAmount ?? 0));
  }

  const trader = ashemLeg.userAccount ?? tx.feePayer ?? 'unknown';

  return {
    direction,
    trader,
    ashemAmount,
    solAmount,
    signature: tx.signature ?? '',
  };
}

async function buildEmbed(swap: ParsedSwap): Promise<Embed> {
  const isBuy = swap.direction === 'buy';
  const solUsd = await getSolUsdPrice();
  const usdAmount = solUsd ? swap.solAmount * solUsd : null;
  const priceInSol = swap.ashemAmount > 0 ? swap.solAmount / swap.ashemAmount : 0;

  let marketCapLine = 'unavailable';
  try {
    const supply = await getTokenSupply(MINT);
    if (solUsd && priceInSol > 0) {
      const mcapUsd = supply.ui * priceInSol * solUsd;
      marketCapLine = `$${fmt(mcapUsd, 0)}`;
    }
  } catch {
    // supply read failed — leave marketCapLine as 'unavailable', don't block the alert
  }

  const bars = '🟢'.repeat(Math.min(20, Math.max(1, Math.round(swap.solAmount))));

  return {
    title: isBuy ? '🟢 New $ASHEM buy' : '🔴 $ASHEM sell',
    description: `${bars}`,
    color: isBuy ? BUY_COLOR : SELL_COLOR,
    url: `https://solscan.io/tx/${swap.signature}`,
    fields: [
      { name: 'Spent', value: `${fmt(swap.solAmount, 4)} SOL${usdAmount ? ` (~$${fmt(usdAmount)})` : ''}`, inline: true },
      { name: isBuy ? 'Received' : 'Sold', value: `${fmt(swap.ashemAmount)} $ASHEM`, inline: true },
      { name: 'Trader', value: `\`${shortAddr(swap.trader)}\``, inline: true },
      { name: 'Price', value: priceInSol > 0 ? `${priceInSol.toFixed(12)} SOL/ASHEM` : 'n/a', inline: true },
      { name: 'Market cap', value: marketCapLine, inline: true },
      {
        name: 'Verify',
        value: `[Solscan tx](https://solscan.io/tx/${swap.signature}) · [Dexscreener](https://dexscreener.com/solana/${MINT}) · [mint](${solscanToken(MINT)})`,
      },
    ],
    footer: FOOTER,
    timestamp: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  const expected = process.env.HELIUS_WEBHOOK_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'disabled: HELIUS_WEBHOOK_SECRET not set' }, { status: 503 });
  }
  const provided = req.headers.get('authorization') ?? '';
  if (!timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const channelId = process.env.ASHEM_BUYSELL_CHANNEL_ID;
  if (!channelId) {
    return NextResponse.json({ error: 'disabled: ASHEM_BUYSELL_CHANNEL_ID not set' }, { status: 503 });
  }

  let body: HeliusEnhancedTx[];
  try {
    const parsed = await req.json();
    body = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
    // TEMP debug — quitar tras arreglar el parser
  console.log('[buysell-debug]', JSON.stringify(body[0]).slice(0, 3800));
  // Minimum SOL size before it's worth posting, so single-lamport dust/arb bots don't
  // spam the channel. Default 0.05 SOL (~a few USD); override with ASHEM_BUY_ALERT_MIN_SOL.
  const minSol = Number(optionalEnv('ASHEM_BUY_ALERT_MIN_SOL', '0.05'));

  const posted: string[] = [];
  for (const tx of body) {
    const swap = parseSwap(tx);
    if (!swap || swap.ashemAmount <= 0) continue;
    if (swap.solAmount < minSol) continue;

    try {
      const embed = await buildEmbed(swap);
      const msg = await postMessage(channelId, {
        embeds: [embed],
        allowed_mentions: { parse: [] }, // never mass-ping on a trade alert
      });
      posted.push(msg.id);
    } catch (e) {
      // Log and continue — one bad swap in a batch shouldn't drop the rest.
      console.error('buy-sell webhook: failed to post', String((e as Error)?.message ?? e));
    }
  }

  return NextResponse.json({ ok: true, posted: posted.length, received: body.length });
}
