import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CURRICULUM_API, Curriculum, CurriculumTrack, LoadResult } from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
  PhStat,
  ToastService,
} from '@promisehub/components';
import { Subject, startWith, switchMap } from 'rxjs';
import { CurriculumStatusDialog } from '../curriculum-status-dialog/curriculum-status-dialog';
import { CurriculumStatusDialogData } from '../curriculum-status-dialog/curriculum-status-dialog-data';
import { NewModuleDialog } from '../new-module-dialog/new-module-dialog';
import { NewModuleDialogData } from '../new-module-dialog/new-module-dialog-data';
import { NewTrackDialog } from '../new-track-dialog/new-track-dialog';
import { statusLabel, statusTone } from '../status-label';

/** Curriculum (mock: curriculum-tracks, L2-066): each track with its modules in the order youth see, reordered with Move up and Move down. */
@Component({
  selector: 'ph-curriculum-tracks-page',
  imports: [
    PhBadge,
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
  templateUrl: './curriculum-tracks-page.html',
})
export class CurriculumTracksPage {
  private readonly api = inject(CURRICULUM_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly refresh$ = new Subject<void>();
  /** The accessible name of the move button to focus after a reorder reloads the list. */
  private readonly focusAfterMove = signal<string | null>(null);

  /** Null while loading. */
  protected readonly result = toSignal(
    this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.api.tracks().pipe(startWith<LoadResult<Curriculum> | null>(null))),
    ),
    { initialValue: null },
  );
  protected readonly counts = computed(() => {
    const r = this.result();
    if (r?.status !== 'loaded') return null;
    const tracks = r.value.tracks;
    const modules = tracks.flatMap((t) => t.modules);
    const lessons = modules.reduce((n, m) => n + m.lessonCount, 0);
    return {
      tracks: tracks.length,
      tracksPublished: tracks.filter((t) => t.status === 'Published').length,
      modules: modules.length,
      modulesPublished: modules.filter((m) => m.status === 'Published').length,
      lessons,
    };
  });
  protected readonly statusLabel = statusLabel;
  protected readonly statusTone = statusTone;

  constructor() {
    afterRenderEffect(() => {
      const label = this.focusAfterMove();
      if (!label || this.result()?.status !== 'loaded') return;
      const buttons =
        this.host.nativeElement.querySelectorAll<HTMLButtonElement>('button[aria-label]');
      const target = [...buttons].find((b) => b.getAttribute('aria-label') === label);
      if (!target) return;
      const sibling = label.endsWith(' up')
        ? label.replace(/ up$/, ' down')
        : label.replace(/ down$/, ' up');
      const fallback = [...buttons].find((b) => b.getAttribute('aria-label') === sibling);
      (target.disabled ? fallback : target)?.focus();
      this.focusAfterMove.set(null);
    });
  }

  protected reload(): void {
    this.refresh$.next();
  }

  protected details(track: CurriculumTrack): string {
    return `Key: ${track.key}`;
  }

  protected moduleMeta(lessons: number): string {
    return lessons === 0 ? 'No lessons yet' : `${lessons} lesson${lessons === 1 ? '' : 's'}`;
  }

  protected newTrack(): void {
    this.dialogs
      .open<boolean, undefined, NewTrackDialog>(NewTrackDialog)
      .closed.subscribe((saved) => saved && this.reload());
  }

  protected newModule(track: CurriculumTrack): void {
    this.dialogs
      .open<string, NewModuleDialogData, NewModuleDialog>(NewModuleDialog, {
        trackId: track.id,
        trackName: track.name,
      })
      .closed.subscribe((id) => id && void this.router.navigate(['/curriculum/modules', id]));
  }

  protected changeStatus(track: CurriculumTrack): void {
    this.dialogs
      .open<boolean, CurriculumStatusDialogData, CurriculumStatusDialog>(CurriculumStatusDialog, {
        kind: 'track',
        id: track.id,
        name: track.name,
        status: track.status,
        audience: 'The cohorts that follow this track',
      })
      .closed.subscribe((saved) => saved && this.reload());
  }

  protected move(track: CurriculumTrack, index: number, by: -1 | 1): void {
    const ids = track.modules.map((m) => m.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + by, 0, moved!);
    const title = track.modules[index]!.title;
    this.api.reorderModules(track.id, ids).subscribe((outcome) => {
      if (outcome.status === 'saved') {
        this.focusAfterMove.set(`Move ${title} ${by < 0 ? 'up' : 'down'}`);
        this.reload();
      } else {
        this.toasts.show({
          tone: 'danger',
          title: 'The order was not saved',
          text: 'Try again.',
        });
      }
    });
  }
}
