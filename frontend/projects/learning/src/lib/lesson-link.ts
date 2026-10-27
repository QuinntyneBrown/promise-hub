import type { LessonKind } from '@promisehub/api';

/** Where a lesson opens: coding lessons and projects in the coding page, the rest in the lesson page. */
export function lessonLink(kind: LessonKind, id: string): string[] {
  return kind === 'Coding' || kind === 'Project'
    ? ['/learning/coding', id]
    : ['/learning/lessons', id];
}
