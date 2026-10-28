import type { MentorCheckIn, MentorCheckInEngagement, MentorCheckInKind } from '@promisehub/api';
import { type RadioOption, formatDay } from '@promisehub/components';

/** How a mentor check-in’s kind reads (L2-090). */
export const KIND_LABEL: Record<MentorCheckInKind, string> = {
  OneToOne: '1:1',
  Call: 'Call',
  Session: 'Session',
};

export const KIND_OPTIONS: RadioOption[] = (Object.keys(KIND_LABEL) as MentorCheckInKind[]).map(
  (value) => ({
    value,
    label: KIND_LABEL[value],
  }),
);

/** How it went, with a hint so it never relies on one word alone. */
export const ENGAGEMENT_OPTIONS: (RadioOption & { value: MentorCheckInEngagement })[] = [
  { value: 'Struggling', label: 'Struggling', hint: 'Having a hard time' },
  { value: 'Low', label: 'Low', hint: 'Quiet or distracted' },
  { value: 'Steady', label: 'Steady', hint: 'Doing okay' },
  { value: 'Engaged', label: 'Engaged', hint: 'Into it' },
  { value: 'Thriving', label: 'Thriving', hint: 'Flying' },
];

/** “1:1 · Thu 5 Nov · Went engaged”, without the date when the youth is the title (L2-090 criterion 4). */
export function checkInMeta(c: MentorCheckIn, withDate = true): string {
  const went = `Went ${c.engagement.toLowerCase()}`;
  return withDate ? `${KIND_LABEL[c.kind]} · ${formatDay(c.date)} · ${went}` : went;
}

/** Action items, follow-up, guardian informed and his private notes, in one line. */
export function checkInCaption(c: MentorCheckIn): string | null {
  return (
    [
      c.actionItems ? `Action items: ${c.actionItems}` : null,
      c.followUpOn ? `Follow-up ${formatDay(c.followUpOn)}` : null,
      c.guardianInformed ? 'Guardian informed' : null,
      c.privateNotes ? `Private notes: ${c.privateNotes}` : null,
    ]
      .filter(Boolean)
      .join(' · ') || null
  );
}
