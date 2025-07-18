import type { GuildMember, Message, User } from 'seyfert';
import { convertToHEX } from './utils';
import { UserFlags } from 'seyfert/lib/types';

export type Profile = {
  author: string; // author of the message
  avatar?: string; // avatar of the author
  roleColor?: string; // role color of the author
  roleIcon?: string; // role color of the author
  roleName?: string; // role name of the author

  bot?: boolean; // is the author a bot
  verified?: boolean; // is the author verified
};

export async function buildProfiles(messages: Message[]) {
  const profiles: Record<string, Profile> = {};

  // loop through messages
  for (const message of messages) {
    // add all users
    const author = message.author;
    if (!profiles[author.id]) {
      // add profile
      profiles[author.id] = await buildProfile(message.member, message.guildId, author);
    }

    // add interaction users
    if (message.interactionMetadata) {
      const user = await message.client.users.fetch(message.interactionMetadata.user.id);
      if (!profiles[user.id]) {
        profiles[user.id] = await buildProfile(null, message.guildId, user);
      }
    }

    // threads
    if (message.thread && message.thread.lastMessageId) {
      const thread = await message.client.messages.fetch(message.thread.lastMessageId, message.channelId);

      profiles[thread.author.id] = await buildProfile(thread.member, message.guildId, thread.author);
    }
  }

  // return as a JSON
  return profiles;
}

async function buildProfile(member: GuildMember | null | undefined, guildId: string | null | undefined, author: User) {
  await author.fetch();

  if (guildId && !member) member = await author.client.members.fetch(guildId, author.id);

  await member?.fetch();

  const role = await member?.roles.highest();

  await role?.fetch();

  const authorName = author.bot ? author.username : author.tag;
  const roleColor = role?.color ?? author.accentColor;

  return {
    author: member?.nick ?? authorName,
    avatar: member?.avatarURL({ size: 64 }) ?? author.avatarURL({ size: 64 }),
    roleColor: roleColor ? convertToHEX(roleColor) : undefined,
    roleIcon: role?.icon ?? undefined,
    roleName: role?.name ?? undefined,
    bot: author.bot,
    verified: (author.publicFlags ?? 0 & UserFlags.VerifiedBot) === UserFlags.VerifiedBot,
  };
}
