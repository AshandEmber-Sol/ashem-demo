// $ASHEM Discord bot — Interactions API webhook (HTTP, serverless-friendly).
//
// Flow: Discord POSTs here on every slash command. We verify the Ed25519 signature,
// answer PINGs, then either reply immediately (static commands) or ACK with a
// "deferred" response and finish the work in an `after()` continuation that PATCHes
// the reply. Deferral keeps us safely under Discord's 3s limit even on a cold start
// or a slow RPC, using the full 15-min interaction-token window.

import { after, NextRequest, NextResponse } from 'next/server';
import { requireEnv, rpcUrl } from '../../../../lib/ashem/config';
import { isValidDiscordRequest } from '../../../../lib/discord/verify';
import { editOriginalResponse, type MessagePayload } from '../../../../lib/discord/rest';
import {
  handleContrato, handleFaq, handleLinks, handleQuema, handleSupply,
  handleTesoreria, handleVerificarMint,
} from '../../../../lib/discord/handlers';
import { handleReportarScam } from '../../../../lib/discord/scam';

export const runtime = 'nodejs'; // signature verify + after() + fetch; not Edge.
export const dynamic = 'force-dynamic';

// Discord interaction + response type enums (only the ones we use).
const IType = { PING: 1, APPLICATION_COMMAND: 2 } as const;
const RType = { PONG: 1, CHANNEL_MESSAGE: 4, DEFERRED_MESSAGE: 5 } as const;
const EPHEMERAL = 64;

interface InteractionOption { name: string; value: string }
interface Interaction {
  type: number;
  id: string;
  token: string;
  guild_id?: string;
  member?: { user?: { id: string; username: string } };
  user?: { id: string; username: string };
  data?: { name: string; options?: InteractionOption[] };
}

export async function POST(req: NextRequest) {
  const publicKey = requireEnv('DISCORD_PUBLIC_KEY');
  const applicationId = requireEnv('DISCORD_APPLICATION_ID');

  const rawBody = await req.text();
  const valid = await isValidDiscordRequest(
    rawBody,
    req.headers.get('x-signature-ed25519'),
    req.headers.get('x-signature-timestamp'),
    publicKey,
  );
  if (!valid) {
    return new NextResponse('invalid request signature', { status: 401 });
  }

  const interaction = JSON.parse(rawBody) as Interaction;

  // Discord endpoint verification handshake.
  if (interaction.type === IType.PING) {
    return NextResponse.json({ type: RType.PONG });
  }

  if (interaction.type !== IType.APPLICATION_COMMAND || !interaction.data) {
    return NextResponse.json({ type: RType.CHANNEL_MESSAGE, data: { content: 'Unsupported interaction.', flags: EPHEMERAL } });
  }

  const name = interaction.data.name;
  const opt = (n: string) => interaction.data?.options?.find((o) => o.name === n)?.value;
  const user = interaction.member?.user ?? interaction.user;

  // ── Instant (static) commands — reply directly, no deferral needed. ──
  if (name === 'links') {
    return NextResponse.json({ type: RType.CHANNEL_MESSAGE, data: handleLinks() });
  }
  if (name === 'faq') {
    return NextResponse.json({ type: RType.CHANNEL_MESSAGE, data: handleFaq() });
  }

  // ── Deferred commands — ACK now, do the work in after(), then PATCH the reply. ──
  const ephemeral = name === 'reportar-scam';

  const work = async (): Promise<MessagePayload> => {
    switch (name) {
      case 'verificar-mint':
        return handleVerificarMint(String(opt('direccion') ?? opt('dirección') ?? opt('address') ?? ''));
      case 'contrato':
        return handleContrato();
      case 'tesoreria':
        return handleTesoreria();
      case 'supply':
        return handleSupply();
      case 'quema':
        return handleQuema();
      case 'reportar-scam':
        return handleReportarScam({
          guildId: interaction.guild_id ?? null,
          userId: user?.id ?? '',
          username: user?.username ?? 'member',
          reason: String(opt('motivo') ?? opt('reason') ?? '(no description provided)'),
        });
      default:
        return { content: `Unknown command: \`${name}\`` };
    }
  };

  after(async () => {
    let payload: MessagePayload;
    try {
      payload = await work();
    } catch (e) {
      payload = { content: `Something went wrong: \`${String((e as Error)?.message ?? e).slice(0, 200)}\`` };
    }
    try {
      await editOriginalResponse(applicationId, interaction.token, payload);
    } catch {
      // Nothing more we can do — the interaction token may have expired.
    }
  });

  return NextResponse.json({
    type: RType.DEFERRED_MESSAGE,
    data: ephemeral ? { flags: EPHEMERAL } : {},
  });
}

// A GET is handy for a quick "is it deployed" check in a browser. It also reports which
// RPC provider is active — hostname only, never the API key (which lives in the query
// string / path, and .hostname excludes both).
export async function GET() {
  let rpcHost = 'unknown';
  let rpcProvider = 'unknown';
  try {
    rpcHost = new URL(rpcUrl()).hostname;
    rpcProvider = /helius/i.test(rpcHost)
      ? 'helius'
      : /(^|\.)api\.mainnet-beta\.solana\.com$/i.test(rpcHost)
        ? 'public-mainnet'
        : 'custom';
  } catch {
    /* leave as unknown */
  }
  return NextResponse.json({
    ok: true,
    service: 'ashem-discord-interactions',
    rpcProvider,
    rpcHost,
  });
}
