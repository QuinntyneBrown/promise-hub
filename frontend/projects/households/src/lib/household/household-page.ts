import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Guardian, HOUSEHOLDS_API, Household, LoadResult, SESSION_API, can } from '@promisehub/api';
import {
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhFlag,
  PhList,
  PhListItem,
  PhPageHeader,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, startWith, switchMap } from 'rxjs';
import { AddChildDialog } from '../add-child/add-child-dialog';
import { AddGuardianDialog } from '../add-guardian/add-guardian-dialog';
import { EditGuardianDialog } from '../edit-guardian/edit-guardian-dialog';
import { HouseholdActionsDialog } from '../household-actions/household-actions-dialog';

/** A household (mock: household): children, guardians and the household's actions. */
@Component({
  selector: 'ph-household-page',
  imports: [
    PhAlert,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhFlag,
    PhList,
    PhListItem,
    PhPageHeader,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './household-page.html',
})
export class HouseholdPage {
  private readonly api = inject(HOUSEHOLDS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly router = inject(Router);
  private readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  private readonly refresh$ = new Subject<void>();

  /** Route parameter. */
  readonly householdId = input.required<string>();

  protected readonly canWrite = computed(
    () => !!this.session() && can(this.session()!.role, 'writeHouseholds'),
  );
  protected readonly canDelete = computed(
    () => !!this.session() && can(this.session()!.role, 'deleteHouseholds'),
  );
  protected readonly result = toSignal<LoadResult<Household> | null>(
    toObservable(this.householdId).pipe(
      switchMap((id) =>
        this.refresh$.pipe(
          startWith(undefined),
          switchMap(() => this.api.get(id)),
        ),
      ),
    ),
    { initialValue: null },
  );
  protected readonly busy = signal(false);

  protected reload(): void {
    this.refresh$.next();
  }

  protected subtitle(h: Household): string {
    const g = h.guardians.length;
    const c = h.children.length;
    return [
      `${g} ${g === 1 ? 'guardian' : 'guardians'}`,
      `${c} ${c === 1 ? 'child' : 'children'}`,
      h.language,
    ].join(' · ');
  }

  protected guardianMeta(g: Guardian): string {
    return [g.relationship, g.mobile, g.email, g.canPickUp ? 'approved pickup' : null]
      .filter(Boolean)
      .join(' · ');
  }

  protected childMeta(age: number | null, school: string | null): string {
    return [age !== null ? `${age}` : null, school].filter(Boolean).join(' · ');
  }

  protected addChild(h: Household): void {
    this.dialogs
      .open<boolean, Household, AddChildDialog>(AddChildDialog, h)
      .closed.subscribe((added) => added && this.reload());
  }

  protected addGuardian(h: Household): void {
    this.dialogs
      .open<boolean, Household, AddGuardianDialog>(AddGuardianDialog, h)
      .closed.subscribe((added) => added && this.reload());
  }

  protected editGuardian(g: Guardian): void {
    this.dialogs
      .open<boolean, Guardian, EditGuardianDialog>(EditGuardianDialog, g)
      .closed.subscribe((saved) => saved && this.reload());
  }

  protected actions(h: Household): void {
    this.dialogs
      .open<
        'deleted' | undefined,
        { household: Household; canDelete: boolean },
        HouseholdActionsDialog
      >(HouseholdActionsDialog, {
        household: h,
        canDelete: this.canDelete(),
      })
      .closed.subscribe(
        (result) => result === 'deleted' && void this.router.navigate(['/families']),
      );
  }
}
