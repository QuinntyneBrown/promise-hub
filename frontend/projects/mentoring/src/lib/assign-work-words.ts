import type { AssignWorkCohort, AssignWorkItem, AssignWorkYouth } from '@promisehub/api';
import type { CheckboxOption, RadioOption, SelectOption } from '@promisehub/components';

/** What a mentor can assign (L2-092): the kind's choice, with what it is in a few words. */
export const KIND_OPTIONS: RadioOption[] = [
  { value: 'Lesson', label: 'Lesson', hint: 'Something to read' },
  { value: 'Quiz', label: 'Quiz', hint: 'Questions to answer' },
  { value: 'Assignment', label: 'Assignment', hint: 'Something to make and hand in' },
];

export const WHO_OPTIONS: RadioOption[] = [
  { value: 'cohort', label: 'A whole cohort', hint: 'Everyone on its roster today' },
  { value: 'youth', label: 'Youth I choose', hint: 'One or more of your youth' },
];

const CHOOSE: Record<AssignWorkItem['kind'], string> = {
  Lesson: 'Choose a lesson',
  Quiz: 'Choose a quiz',
  Assignment: 'Choose an assignment',
};

/** The items of one kind as "title · module", after a prompt to choose. */
export function itemOptions(items: AssignWorkItem[], kind: AssignWorkItem['kind']): SelectOption[] {
  return [
    { value: '', label: CHOOSE[kind] },
    ...items
      .filter((i) => i.kind === kind)
      .map((i) => ({ value: i.id, label: `${i.title} · ${i.moduleTitle}` })),
  ];
}

export function cohortOptions(cohorts: AssignWorkCohort[]): SelectOption[] {
  return [
    { value: '', label: 'Choose a cohort' },
    ...cohorts.map((c) => ({ value: c.id, label: `${c.name} · ${c.youthCount} youth` })),
  ];
}

/** Each youth with their cohorts and, when they have an open at-risk flag, At risk. */
export function youthOptions(youth: AssignWorkYouth[]): CheckboxOption[] {
  return youth.map((y) => ({
    value: y.id,
    label: y.name,
    hint: [y.cohorts || null, y.atRisk ? 'At risk' : null].filter(Boolean).join(' · ') || undefined,
  }));
}
