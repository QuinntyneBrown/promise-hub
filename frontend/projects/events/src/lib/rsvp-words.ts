import type { RsvpResponse } from '@promisehub/api';
import type { RadioOption } from '@promisehub/components';

type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

/** The answers a youth chooses from, with their hints (mock: rsvp). */
export const RSVP_OPTIONS: RadioOption[] = [
  { value: 'Going', label: 'Yes, I’ll be there', hint: 'Going' },
  { value: 'Maybe', label: 'Maybe', hint: 'Not sure yet' },
  { value: 'CantMake', label: 'Can’t make it', hint: 'Staff will know not to wait for you' },
];

const WORDS: Record<RsvpResponse, { label: string; tone: BadgeTone }> = {
  Going: { label: 'Going', tone: 'success' },
  Maybe: { label: 'Maybe', tone: 'info' },
  CantMake: { label: 'Can’t make it', tone: 'warning' },
};

/** The badge for an answer, or for none yet. */
export function rsvpBadge(response: RsvpResponse | null): { label: string; tone: BadgeTone } {
  return response ? WORDS[response] : { label: 'Not replied', tone: 'neutral' };
}
