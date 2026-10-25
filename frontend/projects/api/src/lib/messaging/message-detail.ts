import type { ChannelChoice } from './channel-choice';
import type { Delivery } from './delivery';

export interface MessageDetail {
  id: string;
  title: string;
  body: string;
  smsText: string;
  characters: number;
  segments: number;
  sentAt: string;
  sentBy: string;
  audience: string;
  channel: ChannelChoice;
  status: 'Sending' | 'Sent';
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  pausedCount: number;
  languages: string[];
  deliveries: Delivery[];
}
