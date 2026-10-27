import type { BadgeRule, BadgeSummary } from '@promisehub/api';
import type { SelectOption } from '@promisehub/components';

/** The icons a badge may use, as the server accepts them, with the label the builder shows. */
export const BADGE_ICONS: SelectOption[] = [
  { value: 'star', label: 'Star' },
  { value: 'award', label: 'Medal' },
  { value: 'heart', label: 'Heart' },
  { value: 'flag', label: 'Flag' },
  { value: 'book', label: 'Book' },
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'people', label: 'People' },
  { value: 'check', label: 'Tick' },
];

export const RULE_LABELS: Record<BadgeRule, string> = {
  LessonCompleted: 'Completes a lesson',
  ModuleCompleted: 'Completes a module',
  QuizPassed: 'Passes a quiz',
  AssignmentAccepted: 'Has an assignment accepted',
};

/** "Completes a module · Leading by Serving", or how a badge by hand is earned. */
export function earnedBy(b: Pick<BadgeSummary, 'kind' | 'rule' | 'targetTitle'>): string {
  return b.kind === 'Manual' || !b.rule
    ? 'A program director awards it'
    : `${RULE_LABELS[b.rule]} · ${b.targetTitle ?? ''}`;
}
