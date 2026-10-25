import type { ChannelChoice } from './channel-choice';

/** Who a message is for (a program or an event, optionally one household language), what it says and how it goes. */
export interface AudienceRequest {
  programId: string | null;
  eventId: string | null;
  language: string | null;
  body: string;
  channel: ChannelChoice;
}
