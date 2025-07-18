import { DiscordAttachment, DiscordAttachments } from '@derockdev/discord-components-react';
import React from 'react';
import type { Attachment as AttachmentType, Message } from 'seyfert';
import type { RenderMessageContext } from '..';
import type { AttachmentTypes } from '../../types';
import { formatBytes } from '../../utils/utils';
import type { APIAttachment, APIMessage } from 'seyfert/lib/types';
import { ReplaceRegex, toSnakeCase } from 'seyfert/lib/common';

/**
 * Renders all attachments for a message
 * @param message
 * @param context
 * @returns
 */
export async function Attachments(props: { message: Message; context: RenderMessageContext }) {
  if (props.message.attachments.length === 0) return <></>;

  return (
    <DiscordAttachments slot="attachments">
      {props.message.attachments.map((attachment, id) => (
        <Attachment attachment={attachment as never} message={props.message} context={props.context} key={id} />
      ))}
    </DiscordAttachments>
  );
}

// "audio" | "video" | "image" | "file"
function getAttachmentType(attachment: AttachmentType): AttachmentTypes {
  const type = attachment.contentType?.split('/')?.[0] ?? 'unknown';
  if (['audio', 'video', 'image'].includes(type)) return type as AttachmentTypes;
  return 'file';
}

/**
 * Renders one Discord Attachment
 * @param props - the attachment and rendering context
 */
export async function Attachment({
  attachment,
  context,
  message,
}: {
  attachment: AttachmentType;
  context: RenderMessageContext;
  message: Message;
}) {
  let url = attachment.url;
  const name = attachment.filename;
  const width = attachment.width;
  const height = attachment.height;

  const type = getAttachmentType(attachment);
  const attach = ('data' in attachment ? attachment.data : attachment) as APIAttachment;
  const json = toJSON(message) as APIMessage;

  // if the attachment is an image, download it to a data url
  if (type === 'image') {
    const downloaded = await context.callbacks.resolveImageSrc(attach, json);

    if (downloaded !== null) {
      url = downloaded ?? url;
    }
  }

  return (
    <DiscordAttachment
      type={type}
      size={formatBytes(attachment.size)}
      key={attachment.id}
      slot="attachment"
      url={url}
      alt={name ?? undefined}
      width={width ?? undefined}
      height={height ?? undefined}
    />
  );
}

/**
 * Converts a Message to a JSON object
 * @param {Message} message the message to convert
 * @returns the JSON object
 */
function toJSON(message: Message) {
  const keys = Object.getOwnPropertyNames(message);
  const obj: Partial<APIMessage> = {};

  for (const key of keys) {
    if (['timestamp', 'client'].includes(key)) continue;

    const value = message[key as keyof Message];
    if (value && typeof value === 'object' && 'client' in value)
      Object.defineProperty(value, 'client', { value: undefined });

    if (value === undefined || value === null) continue;

    obj[ReplaceRegex.snake(key) as keyof APIMessage] = toSnakeCase(message[key as keyof Message] as never);
  }

  return obj;
}
