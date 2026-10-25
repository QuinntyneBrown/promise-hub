import type { ChannelChoice, Delivery } from '@promisehub/api';

/** How a send choice reads in lists: "text and email", "email" or "text". */
export function channelLabel(channel: ChannelChoice): string {
  return channel === 'EmailOnly' ? 'email' : channel === 'TextOnly' ? 'text' : 'text and email';
}

/** A delivery's channel with the household language when it is not English: "Text (Spanish)". */
export function deliveryChannel(d: Delivery): string {
  const channel = d.channel === 'Sms' ? 'Text' : 'Email';
  return d.language && d.language !== 'English' ? `${channel} (${d.language})` : channel;
}
