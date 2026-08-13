// $ASHEM — Cowork → Discord publish bridge.
//
// A protected internal endpoint (NOT public) that lets the owner publish a message to
// a specific channel over HTTPS from Cowork — e.g. the weekly supply report to
// #reportes-de-supply, or a #dev-log draft after approval. This replaces not having a
// native Discord connector in Cowork; the bot is the bridge.
//
// Auth: a shared secret in the `x-cowork-secret` header, compared in constant time.
// Set COWORK_PUBLISH_SECRET in the deployment env. This secret is the only thing
// standing between the internet and "post as the bot", so it must be long + random.
//
// Safety: before using this against public channels, test it against a private channel
// (see README). The bot only posts what it's given; it never auto-publishes.

import { NextRequest, NextResponse } from 'next/server';
import { postMessage, type Embed } from '../../../../lib/discord/rest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

interface PublishBody {
  channelId: string;
  content?: string;
  embeds?: Embed[];
}

export async function POST(req: NextRequest) {
  const expected = process.env.COWORK_PUBLISH_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'bridge disabled: COWORK_PUBLISH_SECRET not set' }, { status: 503 });
  }
  const provided = req.headers.get('x-cowork-secret') ?? '';
  if (!timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: PublishBody;
  try {
    body = (await req.json()) as PublishBody;
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  if (!body.channelId) {
    return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
  }
  if (!body.content && !(body.embeds && body.embeds.length)) {
    return NextResponse.json({ error: 'provide content and/or embeds' }, { status: 400 });
  }

  try {
    const msg = await postMessage(body.channelId, {
      content: body.content,
      embeds: body.embeds,
      // The bridge never mass-pings; suppress @everyone/@here/role pings by default.
      allowed_mentions: { parse: [] },
    });
    return NextResponse.json({ ok: true, messageId: msg.id });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message ?? e) }, { status: 502 });
  }
}
