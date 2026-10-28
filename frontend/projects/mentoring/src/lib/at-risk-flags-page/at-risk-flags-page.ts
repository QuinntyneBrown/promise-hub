import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AtRiskFlag, AtRiskFlags, LoadResult, MENTORING_API, SESSION_API } from '@promisehub/api';
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
  PhSkeleton,
  PhTabs,
  TabItem,
  ToastService,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, map, startWith, switchMap } from 'rxjs';
import { raisedLine, resolvedLine, severityTone } from '../flag-words';
import { RaiseFlagDialog } from '../raise-flag-dialog/raise-flag-dialog';
import { RaiseFlagDialogData } from '../raise-flag-dialog-data';
import { ResolveFlagDialog } from '../resolve-flag-dialog/resolve-flag-dialog';
import { ResolveFlagDialogData } from '../resolve-flag-dialog-data';

type Status = 'Open' | 'Resolved';

/**
 * At-risk flags (mock: mentor-flags, L2-091 criterion 4): a mentor's flags on his youth, or every flag of the organization for admins and
 * program directors, open (most serious first) or resolved (newest first, with the outcome). Raise a flag and Resolve open their dialogs
 * and the list reloads.
 */
@Component({
  selector: 'ph-at-risk-flags-page',
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
    PhTabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './at-risk-flags-page.html',
})
export class AtRiskFlagsPage {
  private readonly api = inject(MENTORING_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly refresh$ = new Subject<void>();

  protected readonly status = signal<Status>(
    inject(ActivatedRoute).snapshot.queryParamMap.get('status') === 'Resolved'
      ? 'Resolved'
      : 'Open',
  );
  protected readonly tone = severityTone;
  protected readonly raised = raisedLine;
  protected readonly resolvedCaption = resolvedLine;

  /** Null while loading. */
  protected readonly result = toSignal<LoadResult<AtRiskFlags> | null>(
    toObservable(this.status).pipe(
      switchMap((status) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() =>
            this.api.flags(status).pipe(startWith<LoadResult<AtRiskFlags> | null>(null)),
          ),
        ),
      ),
    ),
    { initialValue: null },
  );

  private readonly loaded = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });
  /** Whether the Incident log is on, so admins and program directors can report an incident from a flag (L2-091 criterion 7). */
  private readonly incidentsOn = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(
        map((session) => session.modules.includes('Incidents')),
        catchError(() => EMPTY),
      ),
    { initialValue: false },
  );
  protected readonly canRaise = computed(() => this.loaded()?.canRaise ?? false);
  /** Mentors never report incidents; staff who read every flag do while the Incident log is on. */
  protected readonly canReportIncident = computed(
    () => this.loaded()?.canRaise === false && this.incidentsOn(),
  );
  protected readonly subtitle = computed(() =>
    this.loaded()?.canRaise === false
      ? this.canReportIncident()
        ? 'Every at-risk flag at your organization. Mentors raise them; you can resolve them or report an incident.'
        : 'Every at-risk flag at your organization. Mentors raise them; you can resolve them.'
      : 'Youth you’re worried about. Program directors are told when you raise a flag.',
  );
  protected readonly tabs = computed<TabItem[]>(() => [
    { value: 'Open', label: 'Open', count: this.loaded()?.openCount ?? 0 },
    { value: 'Resolved', label: 'Resolved', count: this.loaded()?.resolvedCount ?? 0 },
  ]);

  protected select(value: string): void {
    this.status.set(value === 'Resolved' ? 'Resolved' : 'Open');
  }

  protected track(f: AtRiskFlag): string {
    return f.id;
  }

  protected raise(): void {
    this.dialogs
      .open<string, RaiseFlagDialogData, RaiseFlagDialog>(RaiseFlagDialog, {
        youth: this.loaded()?.youth ?? [],
      })
      .closed.subscribe((name) => {
        if (name === undefined) return;
        this.toasts.show({
          tone: 'success',
          title: 'Flag raised',
          text: `${name} · Program directors have been told`,
        });
        this.status.set('Open');
        this.refresh$.next();
      });
  }

  protected resolve(flag: AtRiskFlag): void {
    this.dialogs
      .open<string, ResolveFlagDialogData, ResolveFlagDialog>(ResolveFlagDialog, { flag })
      .closed.subscribe((name) => {
        if (name !== undefined)
          this.toasts.show({ tone: 'success', title: 'Flag resolved', text: name });
        this.refresh$.next();
      });
  }

  protected reload(): void {
    this.refresh$.next();
  }
}
