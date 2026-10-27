import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Journey, JourneyStage, LEARNING_API, LoadResult, ModuleItem } from '@promisehub/api';
import {
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
import { STATUS_LABEL, STATUS_TONE } from '../status-label';

const STAGE_LABEL: Record<JourneyStage['status'], string> = {
  earned: 'Earned',
  current: 'You’re here',
  ahead: 'Ahead',
};
const STAGE_TONE: Record<JourneyStage['status'], 'success' | 'info' | 'neutral'> = {
  earned: 'success',
  current: 'info',
  ahead: 'neutral',
};

/**
 * Your journey (mock: learn-journey, L2-087 criteria 1 to 3): her overall progress, weekly streak and stage, then the roadmap of every followed
 * track with each module's state and Continue on the module she is in. A youth Learning has not opened for sees the forbidden state.
 */
@Component({
  selector: 'ph-journey-page',
  imports: [
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
  templateUrl: './journey-page.html',
})
export class JourneyPage {
  private readonly api = inject(LEARNING_API);
  private readonly refresh$ = new Subject<void>();
  protected readonly label = STATUS_LABEL;
  protected readonly tone = STATUS_TONE;
  protected readonly stageLabel = STAGE_LABEL;
  protected readonly stageTone = STAGE_TONE;

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<Journey> | null>(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.journey().pipe(startWith<LoadResult<Journey> | null>(null))),
    ),
    { initialValue: null },
  );

  protected percent(j: Journey): string {
    return `${j.totalLessons ? Math.round((100 * j.completedLessons) / j.totalLessons) : 0}%`;
  }

  protected weeks(n: number): string {
    return `${n} week${n === 1 ? '' : 's'}`;
  }

  protected subtitle(j: Journey): string {
    return j.current
      ? `You’re in ${j.current.moduleTitle} now.`
      : 'You finished every lesson that’s out so far.';
  }

  /** The stage she is at, or the last one when every stage is earned. */
  protected stage(j: Journey): { name: string; caption: string } | null {
    const index = j.stages.findIndex((s) => s.status === 'current');
    const at = index >= 0 ? index : j.stages.length - 1;
    if (at < 0) return null;
    return {
      name: j.stages[at]!.name,
      caption: index >= 0 ? `Stage ${at + 1} of ${j.stages.length}` : 'Every stage earned',
    };
  }

  protected stageMeta(s: JourneyStage): string {
    if (s.status !== 'current') return s.description;
    return `${s.proficient} of ${s.competencies.length} competencies proficient · ${s.competencies.join(', ')}`;
  }

  protected moduleMeta(m: ModuleItem, current: boolean): string {
    if (m.status === 'locked') return `Unlocks after ${m.unlockAfter}`;
    const count = `${m.completedLessons} of ${m.lessonCount} lesson${m.lessonCount === 1 ? '' : 's'}`;
    return current ? `${count} · you’re here` : count;
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
