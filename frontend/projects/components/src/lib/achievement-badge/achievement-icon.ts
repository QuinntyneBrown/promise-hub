import type { IconName } from '../icon/icon-name';

/** The library icon that draws a badge's stored icon (star, award, heart, flag, book, sparkle, people or check). */
export function achievementIcon(icon: string): IconName {
  return (
    ({ people: 'mentoring', check: 'check-circle' } as Record<string, IconName>)[icon] ??
    (icon as IconName)
  );
}
