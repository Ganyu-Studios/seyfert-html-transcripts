import { DiscordReply } from '@derockdev/discord-components-react';
import type { RenderMessageContext } from '..';
import React from 'react';
import MessageContent, { RenderType } from './content';
import type { Message } from 'seyfert';
import { convertToHEX } from '../../utils/utils';
import { UserFlags } from 'seyfert/lib/types';

export default async function MessageReply({ message, context }: { message: Message; context: RenderMessageContext }) {
  if (!message.messageReference) return null;
  if (message.messageReference.guildId !== message.guildId) return null;

  const referencedMessage = context.messages.find((m) => m.id === message.messageReference?.messageId);
  if (!referencedMessage) return <DiscordReply slot="reply">Message could not be loaded.</DiscordReply>;

  const isCrosspost = referencedMessage.messageReference && referencedMessage.messageReference.guildId !== message.guildId;
  const isCommand = referencedMessage.interactionMetadata !== null;

  const channel = await message.channel();
  const role = await referencedMessage.member?.roles.highest();

  return (
    <DiscordReply
      slot="reply"
      edited={!isCommand && referencedMessage.editedTimestamp !== null}
      attachment={referencedMessage.attachments.length > 0}
      author={
        referencedMessage.member?.nick ?? referencedMessage.author.tag
      }
      avatar={referencedMessage.author.avatarURL({ size: 32 }) ?? undefined}
      roleColor={convertToHEX(role?.color)}
      bot={!isCrosspost && referencedMessage.author.bot}
      verified={(referencedMessage.author.publicFlags ?? 0 & UserFlags.VerifiedBot) === UserFlags.VerifiedBot}
      op={channel.isThread() && referencedMessage.author.id === channel.ownerId}
      server={isCrosspost ?? undefined}
      command={isCommand}
    >
      {referencedMessage.content ? (
        <span data-goto={referencedMessage.id}>
          <MessageContent content={referencedMessage.content} context={{ ...context, type: RenderType.REPLY }} />
        </span>
      ) : isCommand ? (
        <em data-goto={referencedMessage.id}>Click to see command.</em>
      ) : (
        <em data-goto={referencedMessage.id}>Click to see attachment.</em>
      )}
    </DiscordReply>
  );
}
