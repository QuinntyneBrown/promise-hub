import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LEARNING_BOND_API,
  LearningBondAcceptance,
  LearningBondAgreement,
  LearningBondSignerRequest,
  SESSION_API,
} from '@promisehub/api';
import {
  BreadcrumbItem,
  ErrorSummaryItem,
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhCheckbox,
  PhDialogs,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhSkeleton,
  ToastService,
  formatDay,
  formatFullDay,
  formatTime,
} from '@promisehub/components';
import { LearningBondSignerDialog } from '../learning-bond-signer-dialog/learning-bond-signer-dialog';

/**
 * The Learning Bond data-handling agreement (mock: learning-bond-agreement, L2-136): one page in three sections, accepted for the
 * organization with the authority box. It lives in Settings because it is read and accepted before Learning Bond can be on (ADR 0077).
 */
@Component({
  selector: 'ph-learning-bond-agreement-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhCheckbox,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-agreement-page.html',
  styleUrl: './learning-bond-agreement-page.css',
})
export class LearningBondAgreementPage {
  private readonly api = inject(LEARNING_BOND_API);
  private readonly sessions = inject(SESSION_API);
  private readonly toasts = inject(ToastService);
  private readonly dialogs = inject(PhDialogs);

  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly agreement = signal<LearningBondAgreement | null>(null);
  protected readonly organization = signal('');
  protected readonly authority = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly accepting = signal(false);
  protected readonly resending = signal(false);
  protected readonly cancelling = signal(false);
  protected readonly summary = computed<ErrorSummaryItem[]>(() => {
    const message = this.error();
    return message ? [{ field: 'authority', message }] : [];
  });
  /** Under Learning Bond while it is on; under Modules while it is off, since the hub isn't served then (ADR 0077). */
  protected readonly crumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Settings', link: '/settings/organization' },
    this.agreement()?.moduleOn
      ? { label: 'Learning Bond', link: '/settings/learning-bond' }
      : { label: 'Modules', link: '/settings/modules' },
    { label: 'Agreement' },
  ]);
  protected readonly subtitle = computed(() =>
    this.state() === 'loaded'
      ? `One page. Accept it for ${this.organization()}, or name the person who can.`
      : '',
  );

  constructor() {
    this.sessions.current().subscribe((s) => this.organization.set(s.organizationName));
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.agreement().subscribe((r) => {
      if (r.status === 'loaded') {
        this.agreement.set(r.value);
        this.state.set('loaded');
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
    });
  }

  protected versionLine(a: LearningBondAgreement): string {
    return `Version ${a.version} · effective ${formatFullDay(a.effectiveOn)} · published by PromiseHub`;
  }

  protected acceptedTitle(a: LearningBondAcceptance): string {
    return `Accepted by ${a.acceptedBy} on ${formatFullDay(a.acceptedAt)}, version ${a.version}`;
  }

  protected accept(): void {
    this.accepting.set(true);
    this.api.acceptAgreement(this.authority()).subscribe((outcome) => {
      this.accepting.set(false);
      switch (outcome.status) {
        case 'saved':
          this.error.set(null);
          this.load();
          break;
        case 'invalid':
          this.error.set(outcome.errors['authority'] ?? null);
          break;
        case 'forbidden':
          this.state.set('forbidden');
          break;
        default:
          this.toasts.show({
            tone: 'danger',
            title: 'The agreement wasn’t accepted',
            text: 'Something went wrong. Try again.',
          });
      }
    });
  }

  /** "Board chair · angela@… · emailed Thu 5 Nov, 4:02 pm. The link works for 14 days." */
  protected signerLine(r: LearningBondSignerRequest): string {
    return `${r.title} · ${r.email} · emailed ${formatDay(r.sentAt)}, ${formatTime(new Date(r.sentAt))}. The link works for 14 days.`;
  }

  /** Ask someone else to sign (dialog: learning-bond-signer, L2-137 criterion 1). */
  protected askSigner(): void {
    this.dialogs
      .open<string, string, LearningBondSignerDialog>(LearningBondSignerDialog, this.organization())
      .closed.subscribe((name) => {
        if (!name) return;
        this.toasts.show({ tone: 'success', title: `Link sent to ${name}` });
        this.load();
      });
  }

  /** A new link to the same signer; the earlier one stops working (L2-137 criterion 6). */
  protected resend(r: LearningBondSignerRequest): void {
    this.resending.set(true);
    this.api.resendSigner(r.id).subscribe((outcome) => {
      this.resending.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({ tone: 'success', title: `Link sent again to ${r.name}` });
        this.load();
      } else {
        this.failedToast('The link wasn’t sent');
      }
    });
  }

  /** Cancels the request; its link stops working and the page offers Accept again (L2-137 criterion 6). */
  protected cancelSigner(r: LearningBondSignerRequest): void {
    this.cancelling.set(true);
    this.api.cancelSigner(r.id).subscribe((outcome) => {
      this.cancelling.set(false);
      if (outcome.status === 'saved') {
        this.toasts.show({ tone: 'success', title: `Request to ${r.name} cancelled` });
        this.load();
      } else {
        this.failedToast('The request wasn’t cancelled');
      }
    });
  }

  private failedToast(title: string): void {
    this.toasts.show({ tone: 'danger', title, text: 'Something went wrong. Try again.' });
  }
}
