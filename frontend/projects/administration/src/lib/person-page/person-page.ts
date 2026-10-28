import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadResult, PEOPLE_API, PersonRecord, ROLE_LABELS, Role } from '@promisehub/api';
import {
  BreadcrumbItem,
  Fact,
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhProgressBar,
  PhDialogs,
  PhSkeleton,
  ToastService,
  formatDateTime,
} from '@promisehub/components';
import { ChangeRoleDialog } from '../change-role-dialog/change-role-dialog';

/**
 * A person's record (mock: person): the account, a youth's child record and programs, her mentor while Mentoring is on, her
 * Learning progress while Learning is on, a mentor's youth, and the account's audited history. Admins only (L2-113, L2-114).
 */
@Component({
  selector: 'ph-person-page',
  imports: [
    PhAlert,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhProgressBar,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-page.html',
  styleUrl: './person-page.css',
})
export class PersonPage {
  private readonly api = inject(PEOPLE_API);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);

  protected readonly result = signal<LoadResult<PersonRecord> | null>(null);
  protected readonly person = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });
  protected readonly roleLabel = ROLE_LABELS;
  protected readonly crumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'People', link: '/people' },
    { label: this.person()?.name ?? 'Person' },
  ]);
  protected readonly account = computed<Fact[]>(() => {
    const p = this.person();
    if (!p) return [];
    return [
      { key: 'email', term: 'Email', value: p.email },
      { key: 'role', term: 'Role', value: ROLE_LABELS[p.role] },
      { key: 'status', term: 'Status', value: p.status },
      {
        key: 'signed-in',
        term: 'Last signed in',
        value: p.lastSignedInAt ? formatDateTime(p.lastSignedInAt) : 'Never',
      },
      ...(p.deactivatedAt
        ? [
            {
              key: 'deactivated',
              term: 'Deactivated',
              value: `${formatDateTime(p.deactivatedAt)}${p.deactivatedBy ? ' by ' + p.deactivatedBy : ''}`,
            },
          ]
        : []),
    ];
  });
  protected readonly youth = computed<Fact[]>(() => {
    const p = this.person();
    if (!p?.child) return [];
    const c = p.child;
    return [
      {
        key: 'child',
        term: 'Child record',
        value: [c.name, c.age === null ? null : `${c.age}`, `${c.household} household`]
          .filter(Boolean)
          .join(' · '),
      },
      { key: 'programs', term: 'Programs', value: p.programs.join(', ') || 'None' },
    ];
  });
  protected readonly mentoringFacts = computed<Fact[]>(() => {
    const p = this.person();
    if (!p?.mentoring) return [];
    return p.role === 'Mentor'
      ? [{ key: 'youth', term: 'Youth', value: p.mentoring.youth.join(', ') || 'None yet' }]
      : [{ key: 'mentor', term: 'Mentor', value: p.mentoring.mentor ?? 'No mentor' }];
  });
  protected readonly programFacts = computed<Fact[]>(() => {
    const p = this.person();
    return p && !p.child && p.programs.length
      ? [{ key: 'programs', term: 'Programs', value: p.programs.join(', ') }]
      : [];
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.get(this.id).subscribe((r) => this.result.set(r));
  }

  protected changeRole(p: PersonRecord): void {
    this.dialogs
      .open<boolean, { id: string; name: string; role: Role }, ChangeRoleDialog>(ChangeRoleDialog, {
        id: p.id,
        name: p.name,
        role: p.role,
      })
      .closed.subscribe((done) =>
        this.done(done, `${p.name}’s role changed`, 'It applies on their next action.'),
      );
  }

  private done(done: boolean | undefined, title: string, text: string): void {
    if (!done) return;
    this.toasts.show({ tone: 'success', title, text });
    this.api.get(this.id).subscribe((r) => this.result.set(r));
  }

  protected when(iso: string): string {
    return formatDateTime(iso);
  }
}
