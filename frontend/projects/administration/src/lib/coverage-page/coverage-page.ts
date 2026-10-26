import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Coverage, SESSION_API, STAFF_API, can } from '@promisehub/api';
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
  formatWhen,
} from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';
import { AssignStaffData, AssignStaffDialog } from '../assign-staff-dialog/assign-staff-dialog';
import { InviteStaffDialog } from '../invite-staff-dialog/invite-staff-dialog';

/** Staff coverage (mock: coverage): the next 14 days of sessions, who works them and the gaps; assign staff and invite volunteers (L2-009 criterion 8). */
@Component({
  selector: 'ph-coverage-page',
  imports: [PhBadge, PhButton, PhCard, PhEmptyState, PhErrorPage, PhList, PhListItem, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './coverage-page.html',
})
export class CoveragePage {
  private readonly api = inject(STAFF_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  protected readonly coverage = signal<Coverage | null>(null);
  protected readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  protected readonly allowed = computed(() => !this.me() || can(this.me()!.role, 'assignStaff'));
  protected readonly canInvite = computed(() => !!this.me() && can(this.me()!.role, 'inviteStaff'));
  protected readonly gaps = computed(
    () => this.coverage()?.sessions.filter((s) => s.gap).length ?? 0,
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.api.coverage().subscribe((r) => {
      if (r.status === 'loaded') {
        this.coverage.set(r.value);
        this.state.set('loaded');
      } else if (r.status !== 'forbidden') this.state.set('error');
    });
  }

  protected meta(s: Coverage['sessions'][number]): string {
    const who = s.staff.length ? s.staff.map((p) => p.name).join(', ') : 'No one assigned yet';
    return `${formatWhen(s.startsAt, s.endsAt)} · ${who}`;
  }

  protected assign(s: Coverage['sessions'][number]): void {
    this.dialogs
      .open<boolean, AssignStaffData, AssignStaffDialog>(AssignStaffDialog, {
        session: s,
        people: this.coverage()?.people ?? [],
      })
      .closed.subscribe((done) => {
        if (!done) return;
        this.toasts.show({ tone: 'success', title: 'Staff saved', text: `${s.name} is updated.` });
        this.load();
      });
  }

  protected invite(): void {
    const youthWorkersOnly = this.me()?.role !== 'Admin';
    this.dialogs
      .open<boolean, { youthWorkersOnly: boolean }, InviteStaffDialog>(InviteStaffDialog, {
        youthWorkersOnly,
      })
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
