import type { ChannelChoice } from './channel-choice';

export interface MessageRow {
  id: string;
  title: string;
  sentAt: string;
  sentBy: string;
  recipientCount: number;
  audience: string;
  channel: ChannelChoice;
  status: 'Sending' | 'Sent';
  deliveredCount: number;
  failedCount: number;
  pausedCount: number;
}
