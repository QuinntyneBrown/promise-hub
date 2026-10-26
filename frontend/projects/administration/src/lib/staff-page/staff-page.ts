import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ROLE_LABELS, Role, SESSION_API, STAFF_API, StaffList, can } from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhErrorPage,
  PhList,
  PhListItem,
  PhPageHeader,
  ToastService,
} from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';
import { ChangeRoleDialog } from '../change-role-dialog/change-role-dialog';
import { InviteStaffDialog } from '../invite-staff-dialog/invite-staff-dialog';
import { RemoveStaffDialog } from '../remove-staff-dialog/remove-staff-dialog';

/**
 * Staff and roles (mock: staff): who has access, with what role, and invitations waiting or expired with Resend and
 * Withdraw; admins only (L2-007, L2-009, L2-052).
 */
@Component({
  selector: 'ph-staff-page',
  imports: [PhBadge, PhButton, PhCard, PhEmptyState, PhErrorPage, PhList, PhListItem, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './staff-page.html',
})
export class StaffPage {
  private readonly api = inject(STAFF_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  protected readonly staff = signal<StaffList | null>(null);
  protected readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  protected readonly allowed = computed(() => !this.me() || can(this.me()!.role, 'manageStaff'));
  protected readonly roleLabel = ROLE_LABELS;

  constructor() {
    this.load();
  }

  protected load(): void {
    this.api.list().subscribe((r) => {
      if (r.status === 'loaded') {
        this.staff.set(r.value);
        this.state.set('loaded');
      } else if (r.status !== 'forbidden') this.state.set('error');
    });
  }

  protected invite(): void {
    this.dialogs
      .open<boolean, null, InviteStaffDialog>(InviteStaffDialog, null)
      .closed.subscribe((done) => this.done(done, 'Invitation sent', 'It lasts 14 days.'));
  }

  protected changeRole(m: StaffList['members'][number]): void {
    this.dialogs
      .open<boolean, { id: string; name: string; role: Role }, ChangeRoleDialog>(ChangeRoleDialog, {
        id: m.id,
        name: m.name,
        role: m.role,
      })
      .closed.subscribe((done) =>
        this.done(done, `${m.name}’s role changed`, 'It applies on their next action.'),
      );
  }

  protected remove(m: StaffList['members'][number]): void {
    this.dialogs
      .open<boolean, { id: string; name: string }, RemoveStaffDialog>(RemoveStaffDialog, {
        id: m.id,
        name: m.name,
      })
      .closed.subscribe((done) =>
        this.done(done, `${m.name}’s access removed`, 'Kept in the audit log.'),
      );
  }

  protected resend(invitationId: string, email: string): void {
    this.api
      .resend(invitationId)
      .subscribe((outcome) =>
        this.done(
          outcome.status === 'saved',
          'Invitation resent',
          `${email} has a fresh link for 14 days.`,
        ),
      );
  }

  protected invitationMeta(i: StaffList['invitations'][number]): string {
    const role = i.childName
      ? `${this.roleLabel[i.role]} · ${i.childName}`
      : this.roleLabel[i.role];
    const when = new Date(i.expiresAt).toLocaleDateString('en-CA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    return `${role} · invited by ${i.invitedBy} · ${i.status === 'Expired' ? 'expired' : 'expires'} ${when}`;
  }

  protected withdraw(invitationId: string, email: string): void {
    this.api
      .withdraw(invitationId)
      .subscribe((outcome) =>
        this.done(
          outcome.status === 'saved',
          'Invitation withdrawn',
          `${email} can’t use the link now.`,
        ),
      );
  }

  private done(done: boolean | undefined, title: string, text: string): void {
    if (!done) return;
    this.toasts.show({ tone: 'success', title, text });
    this.load();
  }
}
