import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ACCOUNT_API, Account, ROLE_LABELS, Role, SESSION_API } from '@promisehub/api';
import {
  BreadcrumbItem,
  ErrorSummaryItem,
  Fact,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhSkeleton,
  PhTextField,
  ToastService,
} from '@promisehub/components';

/**
 * Your account › Profile (mock: settings-profile, L2-117): the name and mobile of the active membership; the email, the role and a
 * youth's name are shown read-only because they are set elsewhere.
 */
@Component({
  selector: 'ph-profile-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhSkeleton,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
})
export class ProfilePage {
  private readonly api = inject(ACCOUNT_API);
  private readonly sessions = inject(SESSION_API);
  private readonly toasts = inject(ToastService);

  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Your account', link: '/account' },
    { label: 'Profile' },
  ];
  protected readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  protected readonly account = signal<Account | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly saving = signal(false);
  protected readonly failed = signal(false);
  protected name = '';
  protected mobile = '';

  protected readonly youth = computed(() => this.account()?.role === 'Youth');
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([field, message]) => ({ field, message })),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.load().subscribe((r) => {
      if (r.status === 'loaded') {
        this.account.set(r.value);
        this.name = r.value.name;
        this.mobile = r.value.mobile ?? '';
        this.state.set('loaded');
      } else {
        this.state.set('error');
      }
    });
  }

  protected managed(a: Account): Fact[] {
    return [
      { key: 'role', term: 'Role', value: ROLE_LABELS[a.role as Role] ?? a.role },
      { key: 'organization', term: 'Organization', value: a.organization },
    ];
  }

  protected save(): void {
    this.saving.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.saveProfile(this.name, this.mobile).subscribe((outcome) => {
      this.saving.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({ tone: 'success', title: 'Profile saved' });
        this.sessions.refresh();
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }
}
