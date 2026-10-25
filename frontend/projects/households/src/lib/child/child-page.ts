import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Child, HOUSEHOLDS_API, LoadResult, SESSION_API, can } from '@promisehub/api';
import {
  Fact,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhPageHeader,
  ToastService,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, startWith, switchMap } from 'rxjs';
import { formatDate } from '../dates';
import { EditChildDialog } from '../edit-child/edit-child-dialog';
import { EditMedicalDialog } from '../edit-medical/edit-medical-dialog';

/** A child's profile (mock: child): details and the medical and emergency card. */
@Component({
  selector: 'ph-child-page',
  imports: [PhBreadcrumb, PhButton, PhCard, PhDescriptionList, PhEmptyState, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './child-page.html',
})
export class ChildPage {
  private readonly api = inject(HOUSEHOLDS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  private readonly refresh$ = new Subject<void>();

  /** Route parameters. */
  readonly householdId = input.required<string>();
  readonly childId = input.required<string>();

  protected readonly canWrite = computed(
    () => !!this.session() && can(this.session()!.role, 'writeHouseholds'),
  );
  protected readonly canWriteMedical = computed(
    () => !!this.session() && can(this.session()!.role, 'writeMedical'),
  );
  protected readonly result = toSignal<LoadResult<Child> | null>(
    toObservable(this.childId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() => this.api.getChild(id)),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected reload(): void {
    this.refresh$.next();
  }

  protected subtitle(c: Child): string {
    const age = c.age !== null ? `${c.age} years (born ${formatDate(c.dateOfBirth)})` : null;
    return [age, c.school, `${c.householdName} household`].filter(Boolean).join(' · ');
  }

  protected facts(c: Child): Fact[] {
    const m = c.medical!;
    return [
      {
        key: 'allergies',
        term: 'Allergies',
        value: m.allergies ? `${m.redAlert ? 'Red alert · ' : ''}${m.allergies}` : 'None',
      },
      { key: 'medication', term: 'Medication', value: m.medication ?? 'None' },
      { key: 'conditions', term: 'Conditions', value: m.conditions ?? 'None' },
      { key: 'doctor', term: 'Doctor', value: m.doctor ?? 'Not given' },
      {
        key: 'updated',
        term: 'Updated',
        value: m.updatedBy ? `By ${m.updatedBy} · ${formatDate(m.updatedAt)}` : 'Never',
      },
    ];
  }

  protected edit(c: Child): void {
    this.dialogs
      .open<boolean, Child, EditChildDialog>(EditChildDialog, c)
      .closed.subscribe((saved) => saved && this.reload());
  }

  protected editMedical(c: Child): void {
    this.dialogs
      .open<boolean, Child, EditMedicalDialog>(EditMedicalDialog, c)
      .closed.subscribe((saved) => {
        if (saved) {
          this.toasts.show({
            tone: 'success',
            title: 'Medical details saved',
            text: 'The change is logged.',
          });
          this.reload();
        }
      });
  }
}
