import type { SelectOption } from '@promisehub/components';

/** "The whole module" (an empty value) then each lesson as "Lesson 2 · Last in Line". */
export function attachOptions(lessons: { id: string; title: string }[]): SelectOption[] {
  return [
    { value: '', label: 'The whole module' },
    ...lessons.map((l, i) => ({ value: l.id, label: `Lesson ${i + 1} · ${l.title}` })),
  ];
}
