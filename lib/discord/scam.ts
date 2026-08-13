// /reportar-scam — opens a PRIVATE thread visible to the reporter + staff, so an
// impersonation/phishing report never has to be aired in a public channel.
//
// Design (per owner decision): self-contained private thread, not a dependency on the
// eartharoid Tickets bot. Requires two server-specific env vars:
//   ASHEM_SCAM_CHANNEL_ID  — the parent channel the private thread is spawned from
//   ASHEM_STAFF_ROLE_ID    — the staff role pinged inside the thread
//
// Discord mechanics to know: a private thread (type 12) is only visible to members
// explicitly added to it OR to members whose role has the "Manage Threads" permission.
// So for staff to see it, give your staff role Manage Threads (recommended), or the
// bot can add specific staff user IDs. We add the reporter explicitly and @-mention the
// staff role inside. The bot needs the "Create Private Threads" permission.

import { EMBER, SLATE, VERIFY_TAGLINE } from '../ashem/config';
import { addThreadMember, createPrivateThread, postMessage } from './rest';
import type { MessagePayload } from './rest';

export async function handleReportarScam(args: {
  guildId: string | null;
  userId: string;
  username: string;
  reason: string;
}): Promise<MessagePayload> {
  const channelId = process.env.ASHEM_SCAM_CHANNEL_ID;
  const staffRoleId = process.env.ASHEM_STAFF_ROLE_ID;

  if (!channelId) {
    return ephemeral({
      title: 'Report channel not configured',
      description: 'Staff: set `ASHEM_SCAM_CHANNEL_ID` (and `ASHEM_STAFF_ROLE_ID`) in the deployment env to enable private scam reports.',
      color: SLATE,
    });
  }

  const short = args.reason.trim().slice(0, 60) || 'no description';
  let thread: { id: string };
  try {
    thread = await createPrivateThread(channelId, `scam-report • ${args.username} • ${short}`.slice(0, 100));
    await addThreadMember(thread.id, args.userId);
    const ping = staffRoleId ? `<@&${staffRoleId}> ` : '';
    await postMessage(thread.id, {
      content: `${ping}New scam / impersonation report from <@${args.userId}>:\n\n> ${args.reason.slice(0, 1500)}`,
      allowed_mentions: { roles: staffRoleId ? [staffRoleId] : [], users: [args.userId] },
    });
  } catch (e) {
    return ephemeral({
      title: 'Could not open the report thread',
      description: `Please ping a moderator directly. \`${String((e as Error)?.message ?? e).slice(0, 200)}\``,
      color: SLATE,
    });
  }

  const link = args.guildId ? `https://discord.com/channels/${args.guildId}/${thread.id}` : null;
  return ephemeral({
    title: '✅ Report received — privately',
    description:
      `A private thread was opened for your report — only you and staff can see it.` +
      (link ? `\n\n**[Open your report thread](${link})**` : '') +
      `\n\nThanks for helping keep the community safe. Never share seed phrases or private keys with anyone, staff included.`,
    color: EMBER,
  });
}

function ephemeral(embed: { title: string; description: string; color: number }): MessagePayload {
  return { flags: 64, embeds: [{ ...embed, footer: { text: VERIFY_TAGLINE } }] };
}
