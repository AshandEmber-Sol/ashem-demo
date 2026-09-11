// app/api/circulating-supply/route.ts
//
// Public circulating-supply endpoint for $ASHEM.
//
//   circulating = total mint supply
//               − Ember Reserve balance (bucket B)
//               − operational wallet balance (bucket C)
//
// Everything is read LIVE on-chain via RPC; nothing is hardcoded except the
// public mint/wallet addresses. Returns the exact shape the metadata form
// requires: {"circulatingSupply": <number>}. Extra fields are for transparency
// (the form reads only circulatingSupply); anyone can verify the arithmetic.
//
// Requires env ASHEM_RPC_URL (Helius mainnet — already set in the ashem-demo
// Vercel project for the Discord bot; server-side only, key never leaves here).

const MINT = "BGRvzRVpdPvzHQXPax5MqERsxZLprvWVTvUzpUUUhXot";
const EMBER_RESERVE = "2vPwdFBLHBriu53vZ9c6fKidtMbdmLssKDB6Xpo4TJSW"; // bucket B
const OPERATIONAL = "Adwbuucngmsh6ASpjk2vQBtnGMkYASCLiDUehAhikTQb"; // bucket C
const DECIMALS = 9n;
const UNIT = 10n ** DECIMALS; // 1e9

const RPC = process.env.ASHEM_RPC_URL || "https://api.mainnet-beta.solana.com";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// One JSON-RPC call with a small retry (Helius occasionally returns a transient
// HTTP error / rate-limit — same lesson as the guard). Reads only, safe to repeat.
async function rpc(method: string, params: unknown[]): Promise<any> {
  let lastErr: unknown;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(RPC, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`${method} HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(`${method}: ${json.error.message ?? "rpc error"}`);
      return json.result;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, (i + 1) * 400));
    }
  }
  throw lastErr;
}

// Sum every $ASHEM token account owned by `owner` (base units). Robust: doesn't
// assume a single ATA. Returns 0 if the owner holds none.
async function ownerBalanceBase(owner: string): Promise<bigint> {
  const result = await rpc("getTokenAccountsByOwner", [
    owner,
    { mint: MINT },
    { encoding: "jsonParsed", commitment: "confirmed" },
  ]);
  let sum = 0n;
  for (const acc of result?.value ?? []) {
    const amt = acc?.account?.data?.parsed?.info?.tokenAmount?.amount;
    if (amt) sum += BigInt(amt);
  }
  return sum;
}

const toUi = (b: bigint) => Number(b) / Number(UNIT);

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    const supply = await rpc("getTokenSupply", [MINT, { commitment: "confirmed" }]);
    const totalBase = BigInt(supply.value.amount);
    const reserveBase = await ownerBalanceBase(EMBER_RESERVE);
    const opBase = await ownerBalanceBase(OPERATIONAL);

    let circBase = totalBase - reserveBase - opBase;
    if (circBase < 0n) circBase = 0n; // guard against a transient read anomaly

    const body = {
      circulatingSupply: toUi(circBase),
      // --- transparency (optional; the form only reads circulatingSupply) ---
      totalSupply: toUi(totalBase),
      excluded: {
        emberReserve: toUi(reserveBase), // bucket B
        operational: toUi(opBase), // bucket C
      },
      mint: MINT,
      asOf: new Date().toISOString(),
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // fresh within a couple of minutes; CDN-cached so RPC isn't hammered
        "cache-control": "public, s-maxage=120, max-age=60, stale-while-revalidate=300",
        ...CORS,
      },
    });
  } catch (e) {
    // Never report a fake number: on failure return 503 so consumers keep the
    // last good value and retry.
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 503,
      headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS },
    });
  }
}

export const dynamic = "force-dynamic";
