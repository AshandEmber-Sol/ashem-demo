# Security Policy

Ash & Ember ($ASHEM) runs a **public bug bounty** instead of a paid audit — we pay for real problems found, not for a stamp of approval.

This policy covers the `ashem-demo` repository: the interactive **devnet demo**. It is **lower priority** than the core `-ASHEM` repo — the demo runs on Solana Devnet with zero-value tokens — but its **operational surface is in scope**: the faucet/dispenser and the `GH_DISPATCH_TOKEN` are worth trying to break.

> The bounty model, response times, and payment rules below are the same across both `$ASHEM` repositories. The core repo is [`-ASHEM`](https://github.com/AshandEmber-Sol/-ASHEM).

## Scope

In scope — operational risk on the demo:
- **Faucet / dispenser** — evading the server-side rate limit, draining the dispenser wallet, or otherwise abusing the claim endpoint.
- **`GH_DISPATCH_TOKEN` / harvest button** — spamming `workflow_dispatch` runs, or any way to misuse the token beyond its intended scope.
- Exposure of any secret, or a serverless route that does more than it should.

Out of scope (open a normal GitHub Issue instead — not a bounty report):
- Typos, style suggestions, cosmetic UI bugs.
- Anything requiring the devnet tokens to have value — they do not.
- Findings that are not exploitable (no PoC).

## How to report

- **Exploitable findings → private report** via GitHub's **"Report a vulnerability"** button (Security tab → Advisories). Do **not** open a public Issue for an exploitable bug.
- **Non-exploitable / cosmetic findings → a normal public Issue.**

Include enough to reproduce: a clear description, the affected component, and a proof-of-concept where possible.

## Response times

Two clocks. We acknowledge fast; fix timelines are honest targets, not hard promises.

| Severity | First acknowledgment | Severity confirmation | Fix (target) |
|---|---|---|---|
| Critical | ≤ 72h | ≤ 7 days | as fast as possible |
| High | ≤ 72h | ≤ 7 days | ≤ 30 days |
| Medium / Low | ≤ 7 days | — | no hard deadline |

We acknowledge every report within 72h regardless of severity.

## Severity & bounty

Bounties are **denominated in SOL** (not $ASHEM). The model is a **hybrid**: a modest fixed floor, **or** a percentage of the funds a report demonstrably puts at risk (with PoC) — **whichever is greater**.

| Severity | Example | Fixed floor (now) | % of funds at risk (scales with the project) |
|---|---|---|---|
| **Critical** | Forge or skip a revocation step; break the endgame state machine; drain the vault beyond its cap (core `-ASHEM`) | ~0.2 SOL | up to 10% of funds demonstrably at risk — whichever is greater |
| **High** | Break the floor guarantee; force an incorrect fee calculation | ~0.1 SOL | proportional, below Critical |
| **Medium** | Faucet/dispenser rate-limit failures; harvest errors; accounting drift | ~0.03–0.05 SOL | proportional |
| **Low** | Minor, non-exploitable findings | Public acknowledgment | — |

## How payments work

- The **bounty pool is bounded and declared**: currently **0.5 SOL** (topped up as needed) — never an open-ended promise.
- Bounties are paid from a **dedicated bounty wallet**, separate from the dev, authority, and dispenser wallets.
- The "% of funds at risk" is **only the formula for how much we pay — never the source of the money**. Payments never come from the locked/burned LP or the fee vault; the bounty wallet is funded separately.
- Confirmed reports and payments are recorded in a **public ledger** (date, severity, amount, reporter wallet, fix commit).

## Disclosure

Please give us a reasonable window to confirm and fix before publicly disclosing an exploitable finding. We'll credit you in the public ledger unless you prefer to remain anonymous.