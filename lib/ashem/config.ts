// $ASHEM — shared constants + env access for the Discord command bot.
//
// Everything hardcoded here is PUBLIC on-chain data (mainnet, deployed 2026-07-26,
// see -ASHEM/docs/MAINNET-DEPLOY-LOG.md). None of it is secret. Secrets live only
// in Vercel env vars (see readEnv() below), never in git — same pattern as
// DISPENSER_SECRET_KEY / GH_DISPATCH_TOKEN elsewhere in this project.

// ---- On-chain addresses (mainnet-beta) ----
export const MINT = 'BGRvzRVpdPvzHQXPax5MqERsxZLprvWVTvUzpUUUhXot';
export const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const TREASURY = 'H6ejVfKrWGrGcb3hLgTtUy9Q3s1rDe7cm9pGhnBncge2';
export const TREASURY_ATA = 'AS3L8536pt5EidEmLE2XAAeJ2C53YJLMGo7BAuCAHzjj';
export const DEV_WALLET = 'Cxa9MZvh3Hd41Qcrs1zqeBi1Q14mDicnDQHvAorXDv9H';
export const VAULT = '2B2T7z7TNbDSF2gVSPXZT7MGB8JSssnw9C373BZRYVmc';
// The two transfer-fee authorities intentionally remain live on this "hot" key;
// the off-chain guard (endgame.sh) revokes them itself at end-of-life.
export const HOT_AUTHORITY = 'DBj2zRbarj6J1DAnMmb47Wb1saEgLWPK8VFAuZCZFpmJ';

// ---- Tokenomics ----
export const DECIMALS = 9;
export const INITIAL_SUPPLY = 1_000_000_000; // fixed, mint authority revoked
export const SUPPLY_FLOOR = 300_000_000; // 30% burn floor
export const TRANSFER_FEE_BPS = 150; // 1.5%, maximum fee = u64::MAX (uncapped)

// ---- Brand ----
export const EMBER = 0xea580c; // accent orange, reserved for verified on-chain data
export const SLATE = 0x64748b; // system/neutral (network banners etc.)
export const VERIFY_TAGLINE = "Don't trust us. Verify.";

// ---- Official links for /links ----
// Stable ones are hardcoded (owner-confirmed). The Discord invite is an env var
// because invites rotate/expire — set ASHEM_DISCORD_INVITE to a permanent,
// no-expiry, unlimited-use invite so this command never needs a redeploy.
export const LINKS = {
  website: 'https://ashem.xyz',
  dappMirror: 'https://ashem-demo.vercel.app',
  x: 'https://x.com/ashembersol',
  github: 'https://github.com/AshandEmber-Sol',
};

export function solscanToken(mint: string = MINT): string {
  return `https://solscan.io/token/${mint}`;
}
export function solscanAccount(addr: string): string {
  return `https://solscan.io/account/${addr}`;
}

// ---- Env access (secrets + per-server config) ----
// Throws a clear error if a required secret is missing, so a misconfigured
// deployment fails loudly instead of silently misbehaving.
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

// RPC endpoint: reuse the project's existing mainnet RPC if one is already set,
// otherwise fall back to the public endpoint. A dedicated/paid RPC is recommended
// for reliability, but none of the bot's read commands need the getProgramAccounts
// indexer (that's only the harvest path in -ASHEM), so the public RPC works.
export function rpcUrl(): string {
  return (
    process.env.ASHEM_RPC_URL ||
    process.env.SOLANA_RPC_URL ||
    'https://api.mainnet-beta.solana.com'
  );
}

export function healthUrl(): string {
  return optionalEnv(
    'ASHEM_HEALTH_URL',
    'https://raw.githubusercontent.com/AshandEmber-Sol/-ASHEM/main/state/endgame-health.md',
  );
}

export function discordInvite(): string {
  // Permanent, no-expiry, unlimited-use invite (owner, 2026-08-13). Overridable via env.
  return optionalEnv('ASHEM_DISCORD_INVITE', 'https://discord.gg/x2EXHsztxp');
}
