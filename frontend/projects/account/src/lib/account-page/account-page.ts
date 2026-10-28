import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ACCOUNT_API, Account, LoadResult, ROLE_LABELS, Role } from '@promisehub/api';
import {
  Fact,
  PhBadge,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhPageHeader,
  PhSkeleton,
  ToastService,
} from '@promisehub/components';
import { ChangePasswordDialog } from '../change-password-dialog/change-password-dialog';
import { RecoveryCodesDialog } from '../recovery-codes-dialog/recovery-codes-dialog';
import { SignOutAllDialog } from '../sign-out-all-dialog/sign-out-all-dialog';

/** Your account (mock: account): the hub of personal settings: profile, password, display, two-step sign-in, notifications and devices. */
@Component({
  selector: 'ph-account-page',
  imports: [PhBadge, PhButton, PhCard, PhDescriptionList, PhEmptyState, PhPageHeader, PhSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-page.html',
  styleUrl: './account-page.css',
})
export class AccountPage {
  private readonly api = inject(ACCOUNT_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);

  protected readonly result = signal<LoadResult<Account> | null>(null);
  protected readonly account = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value : null;
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.load().subscribe((r) => this.result.set(r));
  }

  protected facts(a: Account): Fact[] {
    return [
      { key: 'email', term: 'Email', value: a.email },
      { key: 'mobile', term: 'Mobile', value: a.mobile ?? 'Not given' },
      {
        key: 'role',
        term: 'Role',
        value: `${ROLE_LABELS[a.role as Role] ?? a.role} · ${a.organization}`,
      },
    ];
  }

  protected newCodes(): void {
    this.dialogs
      .open<boolean, void, RecoveryCodesDialog>(RecoveryCodesDialog)
      .closed.subscribe(() => this.load());
  }

  protected changePassword(): void {
    this.dialogs
      .open<boolean, void, ChangePasswordDialog>(ChangePasswordDialog)
      .closed.subscribe((done) => {
        if (done)
          this.toasts.show({
            tone: 'success',
            title: 'Password changed',
            text: 'Your other devices were signed out.',
          });
      });
  }

  protected signOutOthers(): void {
    this.dialogs
      .open<boolean, void, SignOutAllDialog>(SignOutAllDialog)
      .closed.subscribe((done) => {
        if (done)
          this.toasts.show({
            tone: 'success',
            title: 'Other devices are signed out',
            text: 'You’re still signed in here.',
          });
      });
  }
}
