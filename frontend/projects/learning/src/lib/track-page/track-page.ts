import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { GatedResult, LEARNING_API, ModuleItem, TrackView } from '@promisehub/api';
import {
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhButtonGroup,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhProgressBar,
  PhSkeleton,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { STATUS_LABEL, STATUS_TONE } from '../status-label';

/** One of the youth's tracks (mock: learn-track, L2-068 criterion 2): modules in order, locked ones naming what unlocks them. */
@Component({
  selector: 'ph-track-page',
  imports: [
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhButtonGroup,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhProgressBar,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './track-page.html',
})
export class TrackPage {
  private readonly api = inject(LEARNING_API);
  private readonly router = inject(Router);
  private readonly refresh$ = new Subject<void>();
  protected readonly label = STATUS_LABEL;
  protected readonly tone = STATUS_TONE;

  /** Route parameter. */
  readonly id = input.required<string>();

  /** Null while loading. */
  protected readonly result = toSignal<GatedResult<TrackView> | null>(
    toObservable(this.id).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() => this.api.track(id).pipe(startWith<GatedResult<TrackView> | null>(null))),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected options(t: TrackView) {
    return t.tracks.map((x) => ({ value: x.id, label: x.name }));
  }

  protected meta(m: ModuleItem): string {
    const count = `${m.lessonCount} lesson${m.lessonCount === 1 ? '' : 's'}`;
    if (m.status === 'locked') return `${count} · Unlocks after ${m.unlockAfter}`;
    const percent = m.lessonCount ? Math.round((100 * m.completedLessons) / m.lessonCount) : 0;
    return `${count} · ${percent}%`;
  }

  protected switchTo(id: string): void {
    void this.router.navigate(['/learning/tracks', id]);
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
