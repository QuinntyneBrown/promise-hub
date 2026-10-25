import type { MessageRow } from './message-row';

export interface MessageList {
  messages: MessageRow[];
  segmentsUsed: number;
  segmentCap: number;
}
