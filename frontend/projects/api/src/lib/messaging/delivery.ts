import type { DeliveryStatus } from './delivery-status';

/** One household's copy of a message. */
export interface Delivery {
  household: string;
  guardian: string | null;
  channel: 'Sms' | 'Email';
  language: string;
  status: DeliveryStatus;
  reason: string | null;
  at: string | null;
}
