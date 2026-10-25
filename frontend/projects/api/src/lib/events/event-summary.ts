import type { SlipStatus } from './slip-status';

export interface EventSummary {
  id: string;
  name: string;
  programId: string;
  programName: string;
  startsAt: string;
  endsAt: string;
  place: string | null;
  rosterSize: number;
  slipStatus: SlipStatus;
  status: 'Scheduled' | 'Cancelled';
}
