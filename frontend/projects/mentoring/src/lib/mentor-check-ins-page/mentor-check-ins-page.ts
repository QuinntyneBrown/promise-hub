import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { LoadResult, MENTORING_API, MentorCheckIn, MentorCheckInHistory } from '@promisehub/api';
import {
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  SelectOption,
  ToastService,
} from '@promisehub/components';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest, startWith, switchMap } from 'rxjs';
import { KIND_LABEL, checkInCaption, checkInMeta } from '../check-in-words';
import { MentorCheckInDialog } from '../mentor-check-in-dialog/mentor-check-in-dialog';
import { MentorCheckInDialogData } from '../mentor-check-in-dialog-data';

/**
 * Mentor check-ins (mock: mentor-check-in-history, L2-090 criterion 4): every mentor check-in the signed-in mentor wrote for his youth, newest
 * first, filtered by youth or type on the server; Log a mentor check-in opens the dialog and the list reloads with the new one on top.
 */
@Component({
  selector: 'ph-mentor-check-ins-page',
  imports: [
    FormsModule,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSelect,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentor-check-ins-page.html',
  styleUrl: './mentor-check-ins-page.css',
})
export class MentorCheckInsPage {
  private readonly api = inject(MENTORING_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  protected readonly youthFilter = signal('');
  protected readonly kindFilter = signal('');
  protected readonly kindOptions: SelectOption[] = [
    { value: '', label: 'All types' },
    ...(Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((value) => ({
      value,
      label: KIND_LABEL[value],
    })),
  ];
  protected readonly meta = checkInMeta;
  protected readonly caption = checkInCaption;

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<MentorCheckInHistory> | null>(
    combineLatest([toObservable(this.youthFilter), toObservable(this.kindFilter)]).pipe(
      switchMap(([childId, kind]) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api
              .checkIns({ childId, kind })
              .pipe(startWith<LoadResult<MentorCheckInHistory> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  /** His youth, from the last load: the youth filter's options and the dialog's choices. */
  private readonly youth = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.youth : [];
  });
  protected readonly youthOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'All youth' },
    ...this.youth().map((y) => ({ value: y.id, label: y.name })),
  ]);

  protected filtered(): boolean {
    return !!this.youthFilter() || !!this.kindFilter();
  }

  protected clearFilters(): void {
    this.youthFilter.set('');
    this.kindFilter.set('');
  }

  protected track(c: MentorCheckIn): string {
    return c.id;
  }

  protected log(): void {
    this.dialogs
      .open<string, MentorCheckInDialogData, MentorCheckInDialog>(MentorCheckInDialog, {
        youth: this.youth(),
        fixed: null,
      })
      .closed.subscribe((name) => {
        if (name === undefined) return;
        this.toasts.show({ tone: 'success', title: 'Mentor check-in saved', text: name });
        this.refresh$.next();
      });
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
