// $ASHEM — slash-command handlers.
//
// Each handler returns the final message payload (content/embeds) that gets sent to
// the user. Data-fetching commands are invoked from an `after()` continuation and
// their result PATCHes the deferred response; instant commands return directly.
//
// Brand rule, enforced here: every fact quoted is read live and shown WITH the source
// (a Solscan / RPC / GitHub link) so the user can re-verify. Ember orange is used only
// for verified on-chain data. Public-facing copy is English.

import {
  EMBER, INITIAL_SUPPLY, LINKS, MINT, SLATE, SUPPLY_FLOOR,
  TOKEN_2022_PROGRAM, TREASURY, TREASURY_ATA,
  VERIFY_TAGLINE, discordInvite, solscanAccount, solscanToken,
} from '../ashem/config';
import {
  fmt, getMintInfo, getSolBalance, getTokenAccountBalance, getTokenSupply,
  isCanonicalToken2022,
} from '../ashem/solana';
import type { Embed, MessagePayload } from './rest';

const FOOTER = { text: VERIFY_TAGLINE };
const now = () => new Date().toISOString();

function authorityLine(value: string | null, expectRevoked: boolean): string {
  if (value === null) return '`None` — revoked ✅';
  const note = expectRevoked ? ' ⚠️ **still live** (expected revoked)' : '';
  return `\`${value}\`${note}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// /verificar-mint <address>
// ─────────────────────────────────────────────────────────────────────────────
export async function handleVerificarMint(address: string): Promise<MessagePayload> {
  // Default to the official $ASHEM mint when no address is passed; any address still
  // works for the anti-scam "is this token real?" case.
  const addr = address.trim() || MINT;
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) {
    return { embeds: [{
      title: 'Invalid address',
      description: `\`${addr}\` doesn't look like a base58 Solana address.`,
      color: SLATE, footer: FOOTER,
    }]};
  }

  let info;
  try {
    info = await getMintInfo(addr);
  } catch (e) {
    return rpcError(e);
  }

  if (!info.exists) {
    return { embeds: [{
      title: 'Account not found',
      description: `No account exists at \`${addr}\` on mainnet.`,
      color: SLATE, url: solscanAccount(addr), footer: FOOTER,
    }]};
  }
  if (!info.isMint) {
    return { embeds: [{
      title: 'Not a token mint',
      description: `\`${addr}\` exists but is not a token mint (owner program: \`${info.ownerProgram}\`).`,
      color: SLATE, url: solscanAccount(addr), footer: FOOTER,
    }]};
  }

  const isAshem = addr === MINT;
  const canonical = isCanonicalToken2022(info);
  const fee = info.transferFee?.newerTransferFee;
  const feeBps = fee?.transferFeeBasisPoints;
  const maxFee = fee?.maximumFee;
  // u64::MAX (18446744073709551615) arrives from jsonParsed as a JS number that loses
  // precision (rounds to 2^64), so an exact string compare misses it. Treat any near-u64
  // value as uncapped — real per-tx caps are orders of magnitude below 2^63.
  const uncapped = String(maxFee) === '18446744073709551615' || Number(maxFee) >= 2 ** 63;

  const fields: NonNullable<Embed['fields']> = [
    { name: 'Token program (owner)', value: canonical
        ? `\`${info.ownerProgram}\`\nCanonical Token-2022 ✅`
        : `\`${info.ownerProgram}\`\n⚠️ not the canonical Token-2022 program`, },
    { name: 'Mint authority', value: authorityLine(info.mintAuthority, false), inline: true },
    { name: 'Freeze authority', value: authorityLine(info.freezeAuthority, false), inline: true },
  ];

  if (info.hasTransferFeeExtension) {
    fields.push({
      name: 'Transfer fee (Token-2022 extension)',
      value: `${feeBps ?? '?'} bps (${((feeBps ?? 0) / 100).toFixed(2)}%) · max fee ${uncapped ? '`u64::MAX` (uncapped)' : String(maxFee)}`,
    });
    fields.push({ name: 'Fee-config authority', value: `\`${info.transferFee?.transferFeeConfigAuthority ?? 'None'}\``, inline: true });
    fields.push({ name: 'Withhold-withdraw authority', value: `\`${info.transferFee?.withdrawWithheldAuthority ?? 'None'}\``, inline: true });
  } else {
    fields.push({ name: 'Transfer fee', value: 'No transfer-fee extension on this mint.' });
  }

  if (info.metadata) {
    fields.push({
      name: 'Metadata',
      value: `**${info.metadata.name ?? '?'}** (${info.metadata.symbol ?? '?'})\nupdate authority: \`${info.metadata.updateAuthority ?? 'None'}\``,
    });
  }

  const title = isAshem ? '✅ $ASHEM mint — verified live' : 'Mint verification';
  const description = isAshem
    ? 'This is the official $ASHEM mint. State below is read live from the RPC right now — re-run any time.'
    : `Live on-chain read for \`${addr}\`. Compare against the official $ASHEM mint before trusting any token.`;

  return { embeds: [{
    title, description, color: EMBER, url: solscanToken(addr),
    fields, footer: FOOTER, timestamp: now(),
  }]};
}

// ─────────────────────────────────────────────────────────────────────────────
// /contrato — "is this the real contract?" (compact /verificar-mint on the ASHEM mint)
// ─────────────────────────────────────────────────────────────────────────────
export async function handleContrato(): Promise<MessagePayload> {
  let info;
  try {
    info = await getMintInfo(MINT);
  } catch (e) {
    return rpcError(e);
  }
  const canonical = isCanonicalToken2022(info);

  return { embeds: [{
    title: canonical ? '✅ Official $ASHEM contract' : '⚠️ Unexpected contract state',
    description:
      '$ASHEM has **no custom on-chain program** — it runs on Solana\'s standard Token-2022 program, ' +
      'so there is no "upgrade authority" to revoke. What matters is that the mint is owned by the ' +
      'canonical Token-2022 program (rules out fakes/clones) and that mint & freeze are revoked. Read live:',
    color: canonical ? EMBER : SLATE,
    url: solscanToken(MINT),
    fields: [
      { name: 'Mint address', value: `\`${MINT}\`` },
      { name: 'Owned by Token-2022', value: canonical
          ? `Yes ✅ — \`${TOKEN_2022_PROGRAM}\``
          : `⚠️ owner is \`${info.ownerProgram}\`, not the canonical program \`${TOKEN_2022_PROGRAM}\`` },
      { name: 'Mint authority', value: authorityLine(info.mintAuthority, false), inline: true },
      { name: 'Freeze authority', value: authorityLine(info.freezeAuthority, false), inline: true },
      { name: 'Verify', value: `[Solscan](${solscanToken(MINT)}) · full detail: \`/verificar-mint ${MINT}\`` },
    ],
    footer: FOOTER, timestamp: now(),
  }]};
}

// ─────────────────────────────────────────────────────────────────────────────
// /tesoreria — treasury address + live balances
// ─────────────────────────────────────────────────────────────────────────────
export async function handleTesoreria(): Promise<MessagePayload> {
  let sol: number, ashem: number;
  try {
    [sol, ashem] = await Promise.all([getSolBalance(TREASURY), getTokenAccountBalance(TREASURY_ATA)]);
  } catch (e) {
    return rpcError(e);
  }
  return { embeds: [{
    title: 'Treasury — live balances',
    description: 'Read live from the RPC. The treasury is public and cold; audit it yourself any time.',
    color: EMBER,
    url: solscanAccount(TREASURY),
    fields: [
      { name: 'Treasury', value: `\`${TREASURY}\`\n[Solscan](${solscanAccount(TREASURY)})` },
      { name: 'Token account (ATA)', value: `\`${TREASURY_ATA}\`\n[Solscan](${solscanAccount(TREASURY_ATA)})` },
      { name: 'SOL balance', value: `${fmt(sol, 4)} SOL`, inline: true },
      { name: '$ASHEM balance', value: `${fmt(ashem)} ASHEM`, inline: true },
    ],
    footer: FOOTER, timestamp: now(),
  }]};
}

// ─────────────────────────────────────────────────────────────────────────────
// /supply — current total supply + floor status (100% live RPC)
// ─────────────────────────────────────────────────────────────────────────────
// Source decision (owner, 2026-08-13): read everything live from the mainnet RPC.
// The endgame-health.md log still reflects devnet figures (the endgame workflow hasn't
// been re-pointed at the mainnet mint), so it is NOT used here — a live getTokenSupply
// is both current and the most "verify"-aligned source.
export async function handleSupply(): Promise<MessagePayload> {
  let supply;
  try {
    supply = await getTokenSupply(MINT);
  } catch (e) {
    return rpcError(e);
  }
  const supplyUi = supply.ui;
  const burned = INITIAL_SUPPLY - supplyUi;
  const aboveFloor = supplyUi - SUPPLY_FLOOR;
  const burnableSpan = INITIAL_SUPPLY - SUPPLY_FLOOR; // 700M
  const pctRemaining = Math.max(0, Math.min(100, (aboveFloor / burnableSpan) * 100));

  return { embeds: [{
    title: '$ASHEM supply',
    description: 'Read live from the mainnet RPC right now. Total supply falls as tokens are burned toward the 300M floor.',
    color: EMBER,
    url: solscanToken(MINT),
    fields: [
      { name: 'Current supply', value: `**${fmt(supplyUi)}** ASHEM`, inline: true },
      { name: 'Burned so far', value: `${fmt(burned)} ASHEM`, inline: true },
      { name: 'Burn floor', value: `${fmt(SUPPLY_FLOOR)} ASHEM (30%)`, inline: true },
      { name: 'Distance to floor', value: `${fmt(aboveFloor)} ASHEM above floor · ${pctRemaining.toFixed(2)}% of the 700M burnable span remaining` },
    ],
    footer: FOOTER, timestamp: now(),
  }]};
}

// ─────────────────────────────────────────────────────────────────────────────
// /quema — burn mechanism + progress toward the floor (100% live RPC)
// ─────────────────────────────────────────────────────────────────────────────
// Same source decision as /supply: burned = INITIAL_SUPPLY − live supply, via RPC.
// The mechanism itself (2/3 burn · 1/3 dev, 6h cron) is described qualitatively.
// Once the endgame workflow is re-pointed at mainnet, the state-machine status can be
// added back as a secondary field (see lib/ashem/health.ts, kept for that purpose).
export async function handleQuema(): Promise<MessagePayload> {
  let supply;
  try {
    supply = await getTokenSupply(MINT);
  } catch (e) {
    return rpcError(e);
  }
  const supplyUi = supply.ui;
  const burned = INITIAL_SUPPLY - supplyUi;
  const aboveFloor = supplyUi - SUPPLY_FLOOR;
  const burnableSpan = INITIAL_SUPPLY - SUPPLY_FLOOR; // 700M
  const pctBurned = Math.max(0, Math.min(100, (burned / burnableSpan) * 100));

  return { embeds: [{
    title: '$ASHEM burn mechanism',
    description:
      'Each cycle harvests withheld transfer fees, then splits **2/3 burned · 1/3 to dev** (rounding always ' +
      'favors the burn). Runs every 6h via a public GitHub Actions workflow — logs open. Figures below are live.',
    color: EMBER,
    url: solscanToken(MINT),
    fields: [
      { name: 'Burned to date', value: `**${fmt(burned)}** ASHEM`, inline: true },
      { name: 'Of the 700M burnable', value: `${pctBurned.toFixed(2)}%`, inline: true },
      { name: 'Toward the floor', value: `${fmt(supplyUi)} → floor ${fmt(SUPPLY_FLOOR)} · ${fmt(aboveFloor)} to go` },
      { name: 'Verify', value: `[Solscan](${solscanToken(MINT)}) · [source & workflow](${LINKS.github}/-ASHEM) · [ledger](${LINKS.github}/-ASHEM/blob/main/state/harvest-ledger.csv)` },
    ],
    footer: FOOTER, timestamp: now(),
  }]};
}

// ─────────────────────────────────────────────────────────────────────────────
// /links — instant, static (owner-confirmed). Discord invite from env.
// ─────────────────────────────────────────────────────────────────────────────
export function handleLinks(): MessagePayload {
  return { embeds: [{
    title: '$ASHEM — official links',
    description: 'The only official links. Anything not on this list is not us. Report impostors with `/reportar-scam`.',
    color: EMBER,
    fields: [
      { name: 'Website', value: LINKS.website, inline: true },
      { name: 'dApp (mirror)', value: LINKS.dappMirror, inline: true },
      { name: 'X', value: LINKS.x, inline: true },
      { name: 'GitHub (source & proofs)', value: LINKS.github, inline: true },
      { name: 'Discord', value: discordInvite(), inline: true },
      { name: 'Mint (verify on Solscan)', value: `[\`${MINT}\`](${solscanToken(MINT)})` },
    ],
    footer: FOOTER,
  }]};
}

// ─────────────────────────────────────────────────────────────────────────────
// /faq — placeholder structure; content filled once #support shows repeat questions.
// ─────────────────────────────────────────────────────────────────────────────
export function handleFaq(): MessagePayload {
  return { embeds: [{
    title: '$ASHEM — FAQ',
    description: 'Quick answers to common questions. (More will be added as patterns emerge in #support.)',
    color: SLATE,
    fields: [
      { name: 'What is $ASHEM?', value: 'A Solana **Token-2022** memecoin with a deflationary burn + dev-sustainability fee, all automated off-chain and publicly auditable. Our principle: **we don\'t ask for trust — we publish proof.**' },
      { name: 'Where do I verify the contract?', value: 'Run `/contrato` (quick check) or `/verificar-mint` (full detail). Everything is read live on-chain — don\'t trust us, verify.' },
    ],
    footer: FOOTER,
  }]};
}

function rpcError(e: unknown): MessagePayload {
  return { embeds: [{
    title: 'On-chain read failed',
    description: `Couldn't reach the RPC just now — try again in a moment.\n\`${String((e as Error)?.message ?? e).slice(0, 200)}\``,
    color: SLATE, footer: FOOTER,
  }]};
}
