import { DiscordActionRow, DiscordButton } from '@derockdev/discord-components-react';
import type { ActionRow, ActionRowMessageComponents } from 'seyfert';
import React from 'react';
import { parseDiscordEmoji } from '../../utils/utils';
import { ButtonStyle, ComponentType } from 'seyfert/lib/types';

export default function ComponentRow({ row, id }: { row: ActionRow; id: number }) {
  return (
    <DiscordActionRow key={id}>
      {row.components.map((component, id) => (
        <Component component={component as never} id={id} key={id} />
      ))}
    </DiscordActionRow>
  );
}

const ButtonStyleMapping = {
  [ButtonStyle.Primary]: 'primary',
  [ButtonStyle.Secondary]: 'secondary',
  [ButtonStyle.Success]: 'success',
  [ButtonStyle.Danger]: 'destructive',
  [ButtonStyle.Link]: 'secondary',
  [ButtonStyle.Premium]: 'primary',
} as const;

export function Component({ component, id }: { component: ActionRowMessageComponents; id: number }) {
  if (component.data.type === ComponentType.Button) {
    return (
      <DiscordButton
        key={id}
        type={'style' in component.data ? ButtonStyleMapping[component.data.style] : 'secondary'}
        url={'url' in component.data ? component.data.url : undefined}
        emoji={'emoji' in component.data ? parseDiscordEmoji(component.data.emoji!) : undefined}
      >
        {'label' in component.data ? component.data.label : undefined}
      </DiscordButton>
    );
  }

  return undefined;
}
