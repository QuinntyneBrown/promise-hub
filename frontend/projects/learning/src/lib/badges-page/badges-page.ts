import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LEARNING_API, LearnerBadges, LoadResult, LockedBadge } from '@promisehub/api';
import {
  AchievementBadgeItem,
  PhAchievementBadge,
  PhAchievementBadges,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhProgressBar,
  PhSkeleton,
  formatDay,
} from '@promisehub/components';
import { Subject, map, startWith, switchMap } from 'rxjs';

/**
 * Badges (mock: learn-badges, L2-087 criteria 4 and 5): her collection, the badges she has earned with when and who, those still to unlock with
 * what earns them and how far, and her milestones ending with Next up.
 */
@Component({
  selector: 'ph-badges-page',
  imports: [
    PhAchievementBadge,
    PhAchievementBadges,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhProgressBar,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badges-page.html',
})
export class BadgesPage {
  private readonly api = inject(LEARNING_API);
  private readonly refresh$ = new Subject<void>();

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<LearnerBadges> | null>(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.badges().pipe(startWith<LoadResult<LearnerBadges> | null>(null))),
    ),
    { initialValue: null },
  );

  protected total(b: LearnerBadges): number {
    return b.earned.length + b.locked.length;
  }

  /** The name she goes by, from her setup (L2-059), for the encouragement. */
  private readonly name = toSignal(
    this.api.onboarding().pipe(map((s) => (s.status === 'loaded' ? s.value.preferredName : null))),
    { initialValue: null },
  );

  protected subtitle(b: LearnerBadges): string {
    const of = `You’ve earned ${b.earned.length} of ${this.total(b)} badges.`;
    if (!b.earned.length) return of;
    return this.name() ? `${of} Keep going, ${this.name()}.` : `${of} Keep going.`;
  }

  protected earned(b: LearnerBadges): AchievementBadgeItem[] {
    return b.earned.map((x) => ({
      key: x.id,
      icon: x.icon,
      name: x.name,
      caption: `Earned ${formatDay(x.awardedAt)}${x.awardedBy ? ' · from ' + x.awardedBy : ''}`,
      locked: false,
    }));
  }

  protected locked(b: LearnerBadges): AchievementBadgeItem[] {
    return b.locked.map((x) => ({
      key: x.id,
      icon: x.icon,
      name: x.name,
      caption: `${x.description} ${this.progress(x)}`.trim(),
      locked: true,
    }));
  }

  /** "1 of 3 lessons" for a module badge, "0 of 1" otherwise; nothing for a badge by hand. */
  private progress(x: LockedBadge): string {
    if (x.total === null || x.completed === null) return '';
    return x.rule === 'ModuleCompleted'
      ? `${x.completed} of ${x.total} lessons.`
      : `${x.completed} of ${x.total}.`;
  }

  protected milestoneMeta(text: string, at: string | null): string {
    return at ? `${formatDay(at)} · ${text}` : text;
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
