import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { LoadResult, QUICK_CARD_API, QuickCard, SESSION_API, can } from '@promisehub/api';
import {
  formatTime,
  PhSyncChip,
  CallContact,
  Fact,
  PhAlert,
  PhBadge,
  PhButton,
  PhCallList,
  PhDialogs,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhList,
  PhListItem,
  PhQuickCardAlert,
  PhQuickCard,
  PhQuickCardSection,
} from '@promisehub/components';
import { EMPTY, Subject, catchError, startWith, switchMap } from 'rxjs';
import { AddPickupData, AddPickupDialog } from '../add-pickup-dialog/add-pickup-dialog';
import { RemovePickupData, RemovePickupDialog } from '../remove-pickup-dialog/remove-pickup-dialog';

/** A child's Quick Card (mock: quick-card): the allergy alert first, then medical, who to call, pickups and notes. */
@Component({
  selector: 'ph-quick-card-page',
  imports: [
    PhQuickCard,
    PhQuickCardSection,
    PhSyncChip,
    PhAlert,
    PhBadge,
    PhButton,
    PhCallList,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhList,
    PhListItem,
    PhQuickCardAlert,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quick-card-page.html',
  styleUrl: './quick-card-page.scss',
})
export class QuickCardPage {
  private readonly api = inject(QUICK_CARD_API);
  private readonly retry$ = new Subject<void>();
  private readonly dialogs = inject(PhDialogs);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  /** Site leads, directors and admins change the approved list (L2-020); everyone else reads it. */
  protected readonly canManage = computed(
    () =>
      !!this.me() &&
      can(this.me()!.role, 'managePickups') &&
      !!this.me()!.modules.includes('Pickup'),
  );

  /** Route parameter. */
  readonly childId = input.required<string>();

  protected readonly result = toSignal<LoadResult<QuickCard> | null>(
    toObservable(this.childId).pipe(
      switchMap((id) =>
        this.retry$.pipe(
          startWith(undefined),
          switchMap(() => this.api.get(id)),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected addPickup(c: QuickCard): void {
    this.dialogs
      .open<boolean, AddPickupData, AddPickupDialog>(AddPickupDialog, {
        childId: this.childId(),
        firstName: c.name.split(' ')[0] ?? c.name,
      })
      .closed.subscribe((done) => done && this.retry());
  }

  protected removePickup(c: QuickCard, p: QuickCard['approvedPickups'][number]): void {
    this.dialogs
      .open<boolean, RemovePickupData, RemovePickupDialog>(RemovePickupDialog, {
        childId: this.childId(),
        pickupId: p.pickupId!,
        name: p.name,
        firstName: c.name.split(' ')[0] ?? c.name,
        primary: c.approvedPickups.find((x) => x.isPrimary)?.name ?? null,
      })
      .closed.subscribe((done) => done && this.retry());
  }

  protected retry(): void {
    this.retry$.next();
  }

  protected savedTime(at: string): string {
    return formatTime(new Date(at));
  }

  protected subtitle(c: QuickCard): string {
    const grade = c.school?.split(', ')[1] ?? null;
    return [c.age !== null ? `${c.age} years` : null, grade, c.programs.join(', ') || null]
      .filter(Boolean)
      .join(' · ');
  }

  protected medicalFacts(c: QuickCard): Fact[] {
    const m = c.medical!;
    return [
      { key: 'allergies', term: 'Allergies', value: m.allergies ?? 'None' },
      { key: 'medication', term: 'Medication', value: m.medication ?? 'None' },
      { key: 'conditions', term: 'Conditions', value: m.conditions ?? 'None' },
      ...(m.healthCard ? [{ key: 'health-card', term: 'Health card', value: m.healthCard }] : []),
      ...(m.doctor ? [{ key: 'doctor', term: 'Doctor', value: m.doctor }] : []),
    ];
  }

  protected contacts(c: QuickCard): CallContact[] {
    return c.callOrder.map((g, i) => ({
      name: g.name,
      relationship: g.relationship,
      meta: i === 0 ? `${g.language} · primary` : 'Backup contact',
      phone: g.phone,
    }));
  }

  protected otherFacts(c: QuickCard): Fact[] {
    return [
      ...(c.school ? [{ key: 'school', term: 'School', value: c.school.split(', ')[0]! }] : []),
      { key: 'language', term: 'Language at home', value: c.language },
      ...(c.notes ? [{ key: 'notes', term: 'Notes', value: c.notes }] : []),
    ];
  }
}
