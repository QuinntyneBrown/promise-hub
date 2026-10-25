import type { SlipDelivery } from './slip-delivery';
import type { SlipFields } from './slip-fields';
import type { SlipResponse } from './slip-response';

export interface Slip extends SlipFields {
  id: string;
  eventId: string;
  eventName: string;
  eventStartsAt: string;
  status: 'Draft' | 'Scheduled' | 'Sent';
  scheduledFor: string | null;
  sentAt: string | null;
  version: number;
  households: number;
  children: number;
  signed: number;
  declined: number;
  outstanding: number;
  responses: SlipResponse[];
  delivery: SlipDelivery | null;
}
