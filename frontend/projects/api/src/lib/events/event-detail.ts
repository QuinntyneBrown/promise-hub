import type { EventRsvps } from './event-rsvps';
import type { SlipStatus } from './slip-status';

export interface EventDetail {
  id: string;
  name: string;
  programId: string;
  programName: string;
  startsAt: string;
  endsAt: string;
  place: string | null;
  requiresSlip: boolean;
  noShowAlert: boolean;
  staffNotes: string | null;
  rosterSize: number;
  slipStatus: SlipStatus;
  status: 'Scheduled' | 'Cancelled';
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationMessage: string | null;
  guardiansTold: boolean;
  /** How many sessions share this one's weekly series; null for a single event. */
  seriesSize: number | null;
  rsvps: EventRsvps;
}
