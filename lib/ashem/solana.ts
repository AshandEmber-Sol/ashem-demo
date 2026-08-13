// $ASHEM — live Solana JSON-RPC reads for the Discord bot.
//
// Deliberately dependency-free (plain fetch against the RPC) so it drops into the
// serverless runtime with no @solana/web3.js bundle. Every command that quotes an
// on-chain fact reads it here, live — nothing is cached beyond the short in-request
// scope. If ashem-demo already exports an equivalent mint-reader used by the dApp,
// prefer importing that instead of this module to keep one source of truth.

import { DECIMALS, TOKEN_2022_PROGRAM, rpcUrl } from './config';

type RpcResult<T> = { result?: T; error?: { message: string } };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    // Never let a slow RPC hang the 15-min interaction window.
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`RPC ${method} HTTP ${res.status}`);
  const json = (await res.json()) as RpcResult<T>;
  if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`);
  if (json.result === undefined) throw new Error(`RPC ${method}: empty result`);
  return json.result;
}

// ---- Types ----
export interface MintExtensionTransferFee {
  transferFeeConfigAuthority: string | null;
  withdrawWithheldAuthority: string | null;
  newerTransferFee?: { transferFeeBasisPoints: number; maximumFee: string | number };
  olderTransferFee?: { transferFeeBasisPoints: number; maximumFee: string | number };
}

export interface MintInfo {
  exists: boolean;
  /** Program that owns the account, e.g. the canonical Token-2022 program. */
  ownerProgram: string | null;
  /** 'spl-token-2022' | 'spl-token' | null (null when not a parseable token mint). */
  programLabel: string | null;
  isMint: boolean;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  decimals: number | null;
  supplyRaw: string | null;
  transferFee: MintExtensionTransferFee | null;
  metadata: { name?: string; symbol?: string; uri?: string; updateAuthority?: string | null } | null;
  metadataPointerAuthority: string | null;
  hasTransferFeeExtension: boolean;
}

interface AccountInfoValue {
  owner: string;
  data: {
    program?: string;
    parsed?: {
      type?: string;
      info?: Record<string, unknown>;
    };
  };
}

function findExtension(info: Record<string, unknown>, name: string): Record<string, unknown> | null {
  const exts = info.extensions as Array<{ extension?: string; state?: Record<string, unknown> }> | undefined;
  if (!Array.isArray(exts)) return null;
  const hit = exts.find((e) => e.extension === name);
  return hit?.state ?? null;
}

/** Read + parse any address as a (possibly Token-2022) mint. Never throws on "not a mint". */
export async function getMintInfo(address: string): Promise<MintInfo> {
  const resp = await rpc<{ value: AccountInfoValue | null }>('getAccountInfo', [
    address,
    { encoding: 'jsonParsed', commitment: 'confirmed' },
  ]);

  const value = resp.value;
  if (!value) {
    return {
      exists: false, ownerProgram: null, programLabel: null, isMint: false,
      mintAuthority: null, freezeAuthority: null, decimals: null, supplyRaw: null,
      transferFee: null, metadata: null, metadataPointerAuthority: null,
      hasTransferFeeExtension: false,
    };
  }

  const parsed = value.data?.parsed;
  const info = parsed?.info ?? {};
  const isMint = parsed?.type === 'mint';

  const feeState = findExtension(info, 'transferFeeConfig');
  const metaState = findExtension(info, 'tokenMetadata');
  const ptrState = findExtension(info, 'metadataPointer');

  return {
    exists: true,
    ownerProgram: value.owner ?? null,
    programLabel: value.data?.program ?? null,
    isMint,
    mintAuthority: (info.mintAuthority as string) ?? null,
    freezeAuthority: (info.freezeAuthority as string) ?? null,
    decimals: (info.decimals as number) ?? null,
    supplyRaw: (info.supply as string) ?? null,
    transferFee: feeState
      ? {
          transferFeeConfigAuthority: (feeState.transferFeeConfigAuthority as string) ?? null,
          withdrawWithheldAuthority: (feeState.withdrawWithheldAuthority as string) ?? null,
          newerTransferFee: feeState.newerTransferFee as MintExtensionTransferFee['newerTransferFee'],
          olderTransferFee: feeState.olderTransferFee as MintExtensionTransferFee['olderTransferFee'],
        }
      : null,
    metadata: metaState
      ? {
          name: metaState.name as string,
          symbol: metaState.symbol as string,
          uri: metaState.uri as string,
          updateAuthority: (metaState.updateAuthority as string) ?? null,
        }
      : null,
    metadataPointerAuthority: (ptrState?.authority as string) ?? null,
    hasTransferFeeExtension: feeState != null,
  };
}

export function isCanonicalToken2022(mint: MintInfo): boolean {
  return mint.exists && mint.ownerProgram === TOKEN_2022_PROGRAM;
}

/** Live total supply (decreases as burns happen). Whole-token float + raw string. */
export async function getTokenSupply(mint: string): Promise<{ ui: number; raw: string; decimals: number }> {
  const r = await rpc<{ value: { amount: string; decimals: number; uiAmount: number | null } }>(
    'getTokenSupply',
    [mint, { commitment: 'confirmed' }],
  );
  return {
    ui: r.value.uiAmount ?? Number(r.value.amount) / 10 ** r.value.decimals,
    raw: r.value.amount,
    decimals: r.value.decimals,
  };
}

/** Native SOL balance (lamports → SOL). */
export async function getSolBalance(pubkey: string): Promise<number> {
  const r = await rpc<{ value: number }>('getBalance', [pubkey, { commitment: 'confirmed' }]);
  return r.value / 1e9;
}

/** SPL token balance of a specific token account (e.g. the treasury ATA). */
export async function getTokenAccountBalance(ata: string): Promise<number> {
  const r = await rpc<{ value: { uiAmount: number | null; amount: string; decimals: number } }>(
    'getTokenAccountBalance',
    [ata, { commitment: 'confirmed' }],
  );
  return r.value.uiAmount ?? Number(r.value.amount) / 10 ** (r.value.decimals ?? DECIMALS);
}

/** Human-friendly big-number formatting: 999,778,388.12 */
export function fmt(n: number, maxFrac = 2): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: maxFrac });
}
