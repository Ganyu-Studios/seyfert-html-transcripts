import { renderToString } from '@derockdev/discord-components-core/hydrate';
import { readFileSync } from 'fs';
import path from 'path';
import React from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import type { AllChannels, AllGuildTextableChannels, GuildRole, Message, User } from 'seyfert';
import type { Awaitable } from 'seyfert/lib/common';
import type { ResolveImageCallback } from '../downloader/images';
import { revealSpoiler, scrollToMessage } from '../static/client';
import { buildProfiles } from '../utils/buildProfiles';
import { streamToString } from '../utils/utils';
import DiscordMessages from './transcript';

// read the package.json file and get the @derockdev/discord-components-core version
let discordComponentsVersion = '^3.6.1';

try {
  const packagePath = path.join(__dirname, '..', '..', 'package.json');
  const packageJSON = JSON.parse(readFileSync(packagePath, 'utf8'));
  discordComponentsVersion = packageJSON.dependencies['@derockdev/discord-components-core'] ?? discordComponentsVersion;
  // eslint-disable-next-line no-empty
} catch {} // ignore errors

export type RenderMessageContext = {
  messages: Message[];
  channel: AllChannels;

  callbacks: {
    resolveImageSrc: ResolveImageCallback;
    resolveChannel: (channelId: string) => Awaitable<AllChannels | null>;
    resolveUser: (userId: string) => Awaitable<User | null>;
    resolveRole: (roleId: string) => Awaitable<GuildRole | null>;
  };

  poweredBy?: boolean;
  footerText?: string;
  saveImages: boolean;
  favicon: 'guild' | string;
  hydrate: boolean;
};

export default async function render({ messages, channel, callbacks, ...options }: RenderMessageContext) {
  const profiles = await buildProfiles(messages);

  // NOTE: this renders a STATIC site with no interactivity
  // if interactivity is needed, switch to renderToPipeableStream and use hydrateRoot on client.
  // tysom sagiriikeda to fix this <3
  const stream = await prerenderToNodeStream(
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* favicon */}
        <link
          rel="icon"
          type="image/png"
          href={
            options.favicon === 'guild'
              ? channel.isDM() || channel.isDirectory()
                ? undefined
                : ((await (channel as AllGuildTextableChannels).guild()).iconURL({ size: 16, extension: 'png' }) ??
                  undefined)
              : options.favicon
          }
        />

        {/* title */}
        <title>
          {channel.isDM() || channel.isDirectory() ? 'Direct Messages' : (channel as AllGuildTextableChannels).name}
        </title>

        {/* message reference handler */}
        <script
          dangerouslySetInnerHTML={{
            __html: scrollToMessage,
          }}
        />

        {!options.hydrate && (
          <>
            {/* profiles */}
            <script
              dangerouslySetInnerHTML={{
                __html: `window.$discordMessage={profiles:${JSON.stringify(profiles)}}`,
              }}
            ></script>
            {/* component library */}
            <script
              type="module"
              src={`https://cdn.jsdelivr.net/npm/@derockdev/discord-components-core@${discordComponentsVersion}/dist/derockdev-discord-components-core/derockdev-discord-components-core.esm.js`}
            ></script>
          </>
        )}
      </head>

      <body
        style={{
          margin: 0,
          minHeight: '100vh',
        }}
      >
        <DiscordMessages messages={messages} channel={channel} callbacks={callbacks} {...options} />
      </body>

      {/* Make sure the script runs after the DOM has loaded */}
      {options.hydrate && <script dangerouslySetInnerHTML={{ __html: revealSpoiler }}></script>}
    </html>
  );

  const markup = await streamToString(stream.prelude);

  if (options.hydrate) {
    const result = await renderToString(markup, {
      beforeHydrate: async (document) => {
        document.defaultView.$discordMessage = {
          profiles,
        };
      },
    });

    return result.html;
  }

  return markup;
}
