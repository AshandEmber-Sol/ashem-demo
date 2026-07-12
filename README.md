# Ash & Ember ($ASHEM) — Devnet Demo

An interactive, on-chain demonstration of the $ASHEM mechanism on **Solana devnet**.
Every action here is a real transaction — nothing is simulated. This interface has
**no smart contract of its own**; it only calls Token-2022's native instructions (and,
for swaps, an already-deployed Raydium CPMM program).

> **Solana Devnet — test network. Nothing here has value or any relationship to mainnet.**
> The SOL and $ASHEM dispensed are devnet-only test funds. Claiming or using them creates
> no allocation, whitelist, or expectation for mainnet.

## What it does
- **Claim** a small amount of devnet SOL + $ASHEM from a dedicated faucet.
- **Transfer** $ASHEM and watch Token-2022 withhold the 1.5% fee live.
- **Harvest** — trigger the same production GitHub Actions workflow (`endgame.sh`) that
  harvests withheld fees and burns 2/3 (1/3 to the dev wallet). The real engine, not a
  simulation.
- **Live mint stats** — circulating supply, current fee, and distance to the 300M burn
  floor, read directly from the mint.
- **Swap** — built but currently disabled on devnet (see Notes).

## Architecture
- Frontend: Next.js (App Router). Wallet connection via Wallet Standard (Phantom/Solflare).
- Serverless API routes handle the faucet dispense and the harvest dispatch.
- **No custom on-chain program is deployed for this demo — on devnet or anywhere.**

## Secrets & wallets — full transparency
Same criterion as the rest of the project: every secret is documented with its exact scope
and worst-case blast radius. All are **devnet-only** and hold **zero real value**.

### Dispenser wallet — `DISPENSER_KEYPAIR_PATH` (dev) / `DISPENSER_SECRET_KEY` (prod)
- **What:** a dedicated devnet keypair that funds the faucet (holds devnet SOL + $ASHEM).
- **Can:** sign transfers of its own devnet funds to visitors.
- **Cannot:** mint, burn, freeze, touch the token authority, or affect anything on mainnet.
- **Worst case if leaked:** someone drains the dispenser's devnet balance — funds with zero
  value. Regenerate the keypair and refill. It is a dedicated wallet: not the dev wallet,
  not any authority.

### GitHub dispatch token — `GH_DISPATCH_TOKEN`
- **What:** a fine-grained GitHub PAT scoped to the single repo `AshandEmber-Sol/-ASHEM`,
  with only `Actions: Read and write`.
- **Can:** trigger the `endgame.yml` workflow (the harvest) and read run status.
- **Cannot:** modify code, read repository secrets, access any other repo, or change settings.
- **Worst case if leaked:** someone triggers extra harvest runs. The workflow only does what
  it always does — harvest withheld fees and burn/split, all visible on-chain. It is
  rate-limited on our side, expires, and is revocable at any time. The token holder never
  obtains the authority keypair: that key lives only in the repo's Actions secret and never
  touches this demo.

### Pool-tester wallet (not a runtime secret)
A dedicated devnet keypair used only to seed the demo liquidity pool. Not an authority, not
the dev wallet.

## Run locally
1. `npm install`
2. Copy `.env.example` to `.env` and fill in the values.
3. `npm run dev`

## Verification
Every action links to its transaction on Solscan (devnet). The frontend source is public;
cite it by commit permalink, never `main`.

## Notes
- **Swap on devnet:** the swap is fully implemented and verified on-chain, but disabled in
  the UI because Phantom's transaction simulation on devnet is pathologically slow (minutes),
  which expires the transaction's blockhash before it can be signed. This is a devnet
  environmental issue, not a code issue — on mainnet, simulation is fast and this does not
  occur.