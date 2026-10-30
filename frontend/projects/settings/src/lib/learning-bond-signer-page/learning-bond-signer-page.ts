import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LEARNING_BOND_API,
  LearningBondSignerAcceptance,
  LearningBondSignerAgreement,
} from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAlert,
  PhButton,
  PhCard,
  PhCheckbox,
  PhEmptyState,
  PhErrorSummary,
  PhGuardianShell,
  PhSkeleton,
  formatFullDay,
  formatTime,
} from '@promisehub/components';

/**
 * The named signer's own page behind the emailed link (mock: learning-bond-agreement, states signer to signer-unknown; L2-137): the
 * agreement, the authority box and Accept, with no sign-in. It lives in Settings beside the agreement page because it is served while
 * Learning Bond is off, so the learning-bond library is never downloaded for it (ADR 0078).
 */
@Component({
  selector: 'ph-learning-bond-signer-page',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCard,
    PhCheckbox,
    PhEmptyState,
    PhErrorSummary,
    PhGuardianShell,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-signer-page.html',
  styleUrl: './learning-bond-signer-page.css',
})
export class LearningBondSignerPage implements OnInit {
  private readonly api = inject(LEARNING_BOND_API);

  /** The link's token, from the route. */
  readonly token = input.required<string>();

  protected readonly state = signal<'loading' | 'loaded' | 'accepted' | 'expired' | 'error'>(
    'loading',
  );
  protected readonly agreement = signal<LearningBondSignerAgreement | null>(null);
  protected readonly acceptance = signal<LearningBondSignerAcceptance | null>(null);
  /** The organization a dead link names, or null when PromiseHub doesn't know the link. */
  protected readonly expiredOrganization = signal<string | null>(null);
  protected readonly authority = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly accepting = signal(false);
  protected readonly summary = computed<ErrorSummaryItem[]>(() => {
    const message = this.error();
    return message ? [{ field: 'authority', message }] : [];
  });
  protected readonly organization = computed(
    () =>
      this.agreement()?.organization ??
      this.acceptance()?.organization ??
      this.expiredOrganization(),
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.signerAgreement(this.token()).subscribe((r) => {
      switch (r.status) {
        case 'loaded':
          this.agreement.set(r.value);
          this.state.set('loaded');
          break;
        case 'expired':
          this.expire(r.organization);
          break;
        case 'not-found':
          this.expire(null);
          break;
        default:
          this.state.set('error');
      }
    });
  }

  protected requestedByLine(a: LearningBondSignerAgreement): string {
    return `${a.requestedBy} asked you, as ${a.title}, to accept it. No PromiseHub account is needed.`;
  }

  protected authorityLabel(a: LearningBondSignerAgreement): string {
    return `I, ${a.name}, have authority to accept this agreement for ${a.organization}`;
  }

  protected versionLine(a: LearningBondSignerAgreement): string {
    return `Version ${a.version} · effective ${formatFullDay(a.effectiveOn)} · published by PromiseHub`;
  }

  protected acceptedTitle(a: LearningBondSignerAcceptance): string {
    return `Accepted on ${formatFullDay(a.acceptedAt)} at ${formatTime(new Date(a.acceptedAt))}, version ${a.version}`;
  }

  protected acceptedText(a: LearningBondSignerAcceptance): string {
    return `Recorded as ${a.name}, ${a.title}, ${a.email}. ${a.requestedBy} has been told. You can close this page.`;
  }

  protected expiredText(): string {
    const organization = this.expiredOrganization();
    return organization
      ? `Ask ${organization} to send a new one.`
      : 'Ask the organization that sent it to send a new one.';
  }

  protected accept(): void {
    this.accepting.set(true);
    this.api.acceptAsSigner(this.token(), this.authority()).subscribe((outcome) => {
      this.accepting.set(false);
      switch (outcome.status) {
        case 'accepted':
          this.error.set(null);
          this.acceptance.set(outcome.value);
          this.agreement.set(null);
          this.state.set('accepted');
          break;
        case 'invalid':
          this.error.set(outcome.errors['authority'] ?? null);
          break;
        case 'expired':
          this.expire(outcome.organization);
          break;
        case 'not-found':
          this.expire(null);
          break;
        default:
          this.error.set('Your acceptance wasn’t recorded. Check your connection and try again.');
      }
    });
  }

  private expire(organization: string | null): void {
    this.agreement.set(null);
    this.expiredOrganization.set(organization || null);
    this.state.set('expired');
  }
}
