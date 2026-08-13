#!/usr/bin/env node
// Register (or refresh) the 8 $ASHEM slash commands with Discord.
//
// Run this ONCE after deploying, and again whenever a command definition changes.
// Guild registration is instant (good for iterating); global takes up to ~1h to
// propagate. Set DISCORD_GUILD_ID to register to your server; omit it to go global.
//
// Usage (from the ashem-demo repo root, with the env vars available):
//   DISCORD_BOT_TOKEN=... DISCORD_APPLICATION_ID=... DISCORD_GUILD_ID=... \
//     node scripts/discord/register-commands.mjs
//
// Or pull them from Vercel first:  vercel env pull .env.local  then load and run.

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const APP_ID = process.env.DISCORD_APPLICATION_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // optional

if (!TOKEN || !APP_ID) {
  console.error('Missing DISCORD_BOT_TOKEN and/or DISCORD_APPLICATION_ID.');
  process.exit(1);
}

// Slash-command option/command types:
const STRING = 3;
const CHAT_INPUT = 1;

const commands = [
  {
    type: CHAT_INPUT,
    name: 'verificar-mint',
    description: 'Verify a mint live on-chain (defaults to $ASHEM; pass any address to check it).',
    options: [
      { type: STRING, name: 'direccion', description: 'Mint to verify (base58). Leave empty to verify the official $ASHEM mint.', required: false },
    ],
  },
  {
    type: CHAT_INPUT,
    name: 'supply',
    description: 'Current $ASHEM supply and progress toward the 300M burn floor (live).',
  },
  {
    type: CHAT_INPUT,
    name: 'quema',
    description: 'Burn mechanism status and trend — where the supply is headed.',
  },
  {
    type: CHAT_INPUT,
    name: 'contrato',
    description: 'Is this the real $ASHEM contract? Token-2022 ownership + authority state, live.',
  },
  {
    type: CHAT_INPUT,
    name: 'tesoreria',
    description: 'Treasury address and its live SOL + $ASHEM balances.',
  },
  {
    type: CHAT_INPUT,
    name: 'reportar-scam',
    description: 'Privately report an impersonator or phishing attempt to staff.',
    options: [
      { type: STRING, name: 'motivo', description: 'What happened? (who/what to report)', required: true },
    ],
  },
  {
    type: CHAT_INPUT,
    name: 'links',
    description: 'The official $ASHEM links — the single anti-impersonation source of truth.',
  },
  {
    type: CHAT_INPUT,
    name: 'faq',
    description: 'Quick answers to common $ASHEM questions.',
  },
];

const base = GUILD_ID
  ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
  : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

const res = await fetch(base, {
  method: 'PUT', // bulk-overwrite: the posted set becomes the exact command set
  headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  console.error(`Registration failed: ${res.status}\n${await res.text()}`);
  process.exit(1);
}

const registered = await res.json();
console.log(`Registered ${registered.length} commands ${GUILD_ID ? `to guild ${GUILD_ID}` : 'globally'}:`);
for (const c of registered) console.log(`  /${c.name}`);
