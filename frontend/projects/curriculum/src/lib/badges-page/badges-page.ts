import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BadgeList, BadgeSummary, CURRICULUM_API, LoadResult } from '@promisehub/api';
import {
  PhAchievementBadge,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhStat,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { badgeIcon, earnedBy } from '../badge-labels';

/** Badges (mock: curriculum-badge, L2-084 criterion 1): each badge with how it is earned and how many youth hold it. */
@Component({
  selector: 'ph-badges-page',
  imports: [
    PhAchievementBadge,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    PhStat,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badges-page.html',
})
export class BadgesPage {
  private readonly api = inject(CURRICULUM_API);
  private readonly refresh$ = new Subject<void>();

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.badges().pipe(startWith<LoadResult<BadgeList> | null>(null))),
    ),
    { initialValue: null },
  );
  protected readonly counts = computed(() => {
    const r = this.result();
    if (r?.status !== 'loaded') return null;
    const badges = r.value.badges;
    const most = [...badges].sort((a, b) => b.earnedCount - a.earnedCount)[0];
    return {
      badges: badges.length,
      automatic: badges.filter((b) => b.kind === 'Automatic').length,
      manual: badges.filter((b) => b.kind === 'Manual').length,
      awards: r.value.awards,
      youth: r.value.youth,
      most: most && most.earnedCount > 0 ? most : null,
    };
  });
  protected readonly badgeIcon = badgeIcon;

  protected meta(b: BadgeSummary): string {
    const parts = [earnedBy(b)];
    if (b.competencyName) parts.push(b.competencyName);
    parts.push(`earned by ${b.earnedCount} youth`);
    return parts.join(' · ');
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
