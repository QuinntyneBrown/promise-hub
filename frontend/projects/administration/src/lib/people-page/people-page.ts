import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LoadResult,
  PEOPLE_API,
  PeoplePage as PeopleList,
  PeopleQuery,
  ROLE_LABELS,
} from '@promisehub/api';
import {
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhPageHeader,
  PhPagination,
  PhSelect,
  PhSkeleton,
  PhTable,
  PhTextField,
  SelectOption,
  TableCell,
  TableColumn,
  ToastService,
  formatDateTime,
} from '@promisehub/components';
import { debounceTime, startWith, switchMap } from 'rxjs';
import { InviteStaffDialog } from '../invite-staff-dialog/invite-staff-dialog';

/**
 * People (mock: people): every account of the organization, searched and filtered on the server, 25 to a page; a name opens the
 * record. Admins only; the Mentor column and filter exist only while Mentoring is on (L2-112, L2-114).
 */
@Component({
  selector: 'ph-people-page',
  imports: [
    FormsModule,
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhPagination,
    PhSelect,
    PhSkeleton,
    PhTable,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './people-page.html',
  styleUrl: './people-page.css',
})
export class PeoplePage {
  private readonly api = inject(PEOPLE_API);
  private readonly router = inject(Router);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly params = inject(ActivatedRoute).snapshot.queryParamMap;
  private readonly retries = signal(0);

  protected readonly filter = signal<PeopleQuery>({
    q: this.params.get('q') ?? '',
    role: this.params.get('role') ?? '',
    status: this.params.get('status') ?? '',
    programId: this.params.get('programId') ?? '',
    page: Number(this.params.get('page') ?? 1) || 1,
  });
  protected readonly result = toSignal(
    toObservable(computed(() => ({ f: this.filter(), n: this.retries() }))).pipe(
      debounceTime(200),
      switchMap(({ f }) => this.api.list(f).pipe(startWith<LoadResult<PeopleList> | null>(null))),
    ),
    { initialValue: null },
  );
  protected readonly list = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });
  protected readonly mentoring = computed(
    () => this.list()?.items.some((p) => p.mentoring) ?? false,
  );
  protected readonly filtering = computed(() => {
    const f = this.filter();
    return !!(f.q || f.role || f.status || f.programId);
  });
  protected readonly columns = computed<TableColumn[]>(() => [
    { key: 'person', label: 'Person' },
    { key: 'role', label: 'Role' },
    { key: 'programs', label: 'Programs', hideOnPhone: true },
    ...(this.mentoring() || this.list()?.roles.includes('Mentor')
      ? [{ key: 'mentor', label: 'Mentor', hideOnPhone: true }]
      : []),
    { key: 'status', label: 'Status' },
    { key: 'signedIn', label: 'Last signed in', hideOnPhone: true },
  ]);
  protected readonly rows = computed(() =>
    (this.list()?.items ?? []).map((p): Record<string, TableCell> => ({
      person: { text: p.name, link: ['/people', p.id], suffix: p.isYou ? '(you)' : undefined },
      role: { text: ROLE_LABELS[p.role], tone: p.role === 'Admin' ? 'success' : 'neutral' },
      programs: p.programs.join(', ') || '—',
      mentor: p.role === 'Youth' ? (p.mentoring?.mentor ?? 'No mentor') : '—',
      status: { text: p.status, tone: p.status === 'Active' ? 'success' : 'neutral' },
      signedIn: p.lastSignedInAt ? formatDateTime(p.lastSignedInAt) : 'Never',
    })),
  );
  protected readonly roleOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'All roles' },
    ...(this.list()?.roles ?? []).map((r) => ({ value: r, label: ROLE_LABELS[r] })),
  ]);
  protected readonly programOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'All programs' },
    ...(this.list()?.programs ?? []).map((p) => ({ value: p.id, label: p.name })),
  ]);
  protected readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Deactivated', label: 'Deactivated' },
  ];

  /** A new organization: nobody but the admin, and no filter narrowing it. */
  protected onlyYou(l: PeopleList): boolean {
    return !this.filtering() && l.total <= 1 && l.items.every((p) => p.isYou);
  }

  protected summary(l: PeopleList): string {
    return `${l.total.toLocaleString('en-US')} ${l.total === 1 ? 'person' : 'people'}`;
  }

  protected set(change: Partial<PeopleQuery>): void {
    this.filter.update((f) => ({ ...f, ...change, page: change.page ?? 1 }));
    const f = this.filter();
    void this.router.navigate([], {
      queryParams: {
        q: f.q || null,
        role: f.role || null,
        status: f.status || null,
        programId: f.programId || null,
        page: f.page > 1 ? f.page : null,
      },
      replaceUrl: true,
    });
  }

  protected retry(): void {
    this.retries.update((n) => n + 1);
  }

  protected invite(): void {
    this.dialogs
      .open<boolean, null, InviteStaffDialog>(InviteStaffDialog, null)
      .closed.subscribe((done) => {
        if (done)
          this.toasts.show({
            tone: 'success',
            title: 'Invitation sent',
            text: 'It lasts 14 days.',
          });
      });
  }
}
