// Thin Discord REST helpers used for deferred follow-ups, the Cowork publish bridge,
// and /reportar-scam private-thread creation.

const API = 'https://discord.com/api/v10';

function botHeaders(): Record<string, string> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error('Missing required env var: DISCORD_BOT_TOKEN');
  return { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' };
}

export interface Embed {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export interface MessagePayload {
  content?: string;
  embeds?: Embed[];
  flags?: number; // 64 = ephemeral
  allowed_mentions?: { parse?: string[]; roles?: string[]; users?: string[] };
}

/** Edit the deferred (@original) response of an interaction. No bot token needed —
 *  the interaction token in the URL authorizes it. */
export async function editOriginalResponse(
  applicationId: string,
  interactionToken: string,
  payload: MessagePayload,
): Promise<void> {
  const res = await fetch(
    `${API}/webhooks/${applicationId}/${interactionToken}/messages/@original`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) },
  );
  if (!res.ok) {
    throw new Error(`editOriginalResponse ${res.status}: ${await res.text()}`);
  }
}

/** Post a message into a channel (used by the Cowork bridge + scam thread). */
export async function postMessage(channelId: string, payload: MessagePayload): Promise<{ id: string }> {
  const res = await fetch(`${API}/channels/${channelId}/messages`, {
    method: 'POST',
    headers: botHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`postMessage ${res.status}: ${await res.text()}`);
  return (await res.json()) as { id: string };
}

/** Create a private thread (type 12) in a channel. Bot needs Create Private Threads. */
export async function createPrivateThread(
  channelId: string,
  name: string,
): Promise<{ id: string }> {
  const res = await fetch(`${API}/channels/${channelId}/threads`, {
    method: 'POST',
    headers: botHeaders(),
    body: JSON.stringify({ name, type: 12, invitable: false, auto_archive_duration: 4320 }),
  });
  if (!res.ok) throw new Error(`createPrivateThread ${res.status}: ${await res.text()}`);
  return (await res.json()) as { id: string };
}

/** Add a member to a thread (so the reporter can see their own private thread). */
export async function addThreadMember(threadId: string, userId: string): Promise<void> {
  const res = await fetch(`${API}/channels/${threadId}/thread-members/${userId}`, {
    method: 'PUT',
    headers: botHeaders(),
  });
  if (!res.ok) throw new Error(`addThreadMember ${res.status}: ${await res.text()}`);
}
