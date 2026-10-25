import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { LoadResult, PROGRAMS_API, Program, RosterChild, SESSION_API, can } from '@promisehub/api';
import {
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhStat,
  ToastService,
  formatSeason,
  formatWhen,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, startWith, switchMap } from 'rxjs';
import { EnrollDialog } from '../enroll-dialog/enroll-dialog';
import { ProgramActionsDialog } from '../program-actions-dialog/program-actions-dialog';
import { RemoveFromRosterDialog } from '../remove-from-roster-dialog/remove-from-roster-dialog';

/** A program (mock: program): numbers, roster and events; archived programs are read-only with Restore. */
@Component({
  selector: 'ph-program-page',
  imports: [
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhStat,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './program-page.html',
})
export class ProgramPage {
  private readonly api = inject(PROGRAMS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly programId = input.required<string>();

  protected readonly canManage = computed(
    () => !!this.session() && can(this.session()!.role, 'managePrograms'),
  );
  protected readonly result = toSignal<LoadResult<Program> | null>(
    toObservable(this.programId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() => this.api.get(id)),
        ),
      ),
    ),
    { initialValue: null },
  );
  protected readonly when = formatWhen;

  protected reload(): void {
    this.refresh$.next();
  }

  protected subtitle(p: Program): string {
    return [
      p.schedule,
      formatSeason(p.startsOn, p.endsOn),
      p.enrollmentOpen ? 'Enrollment open' : 'Enrollment closed',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  protected childMeta(c: RosterChild): string {
    return [c.age !== null ? `${c.age}` : null, c.householdName].filter(Boolean).join(' · ');
  }

  protected upcoming(p: Program): number {
    return p.events.filter((e) => e.status === 'Scheduled').length;
  }

  protected enroll(p: Program): void {
    this.dialogs
      .open<boolean, Program, EnrollDialog>(EnrollDialog, p)
      .closed.subscribe((added) => added && this.reload());
  }

  protected remove(p: Program, child: RosterChild): void {
    this.dialogs
      .open<boolean, { program: Program; child: RosterChild }, RemoveFromRosterDialog>(
        RemoveFromRosterDialog,
        { program: p, child },
      )
      .closed.subscribe((removed) => removed && this.reload());
  }

  protected actions(p: Program): void {
    this.dialogs
      .open<boolean, Program, ProgramActionsDialog>(ProgramActionsDialog, p)
      .closed.subscribe((changed) => changed && this.reload());
  }

  protected restore(p: Program): void {
    this.api.restore(p.id).subscribe((outcome) => {
      if (outcome.status === 'saved') {
        this.toasts.show({
          tone: 'success',
          title: `${p.name} restored`,
          text: 'Enrollment stays closed until you open it.',
        });
        this.reload();
      }
    });
  }
}
