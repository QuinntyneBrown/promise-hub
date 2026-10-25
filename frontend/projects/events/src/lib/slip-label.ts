import { SlipStatus } from '@promisehub/api';

/** How a slip status reads on a badge, and its tone. */
export function slipBadge(status: SlipStatus): {
  label: string;
  tone: 'neutral' | 'warning' | 'success';
} {
  switch (status) {
    case 'Draft':
      return { label: 'Slip not written yet', tone: 'warning' };
    case 'Scheduled':
      return { label: 'Slip scheduled', tone: 'neutral' };
    case 'Sent':
      return { label: 'Slip sent', tone: 'success' };
    default:
      return { label: 'No slip needed', tone: 'neutral' };
  }
}
