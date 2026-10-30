import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LEARNING_BOND_API,
  LearningBondInvitation,
  LearningBondInvitationLanguage,
} from '@promisehub/api';
import {
  BreadcrumbItem,
  ErrorSummaryItem,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmailPreview,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhSkeleton,
  PhSmsPreview,
  PhTextField,
  ToastService,
} from '@promisehub/components';

/** GSM-7, as Messaging counts SMS segments: 160 and 153 characters, or 70 and 67 when any character needs UCS-2. */
const GSM7 =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

/**
 * The guardian invitation (mock: learning-bond-invitation, L2-139): the platform wording in each language the households use, and the
 * sender name, the one part the organization edits. The previews follow the field as the admin types; the server checks the rule.
 */
@Component({
  selector: 'ph-learning-bond-invitation-page',
  imports: [
    FormsModule,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmailPreview,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhSkeleton,
    PhSmsPreview,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-invitation-page.html',
  styleUrl: './learning-bond-invitation-page.css',
})
export class LearningBondInvitationPage {
  private readonly api = inject(LEARNING_BOND_API);
  private readonly toasts = inject(ToastService);

  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Settings', link: '/settings/organization' },
    { label: 'Learning Bond', link: '/settings/learning-bond' },
    { label: 'Invitation' },
  ];
  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly invitation = signal<LearningBondInvitation | null>(null);
  /** The sender name as saved, which the server's wording was filled with. */
  private readonly savedSender = signal('');
  protected readonly sender = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly summary = computed<ErrorSummaryItem[]>(() => {
    const message = this.error();
    return message ? [{ field: 'sender-name', message }] : [];
  });
  protected readonly subtitle = computed(() => {
    const names = (this.invitation()?.languages ?? []).map((l) => l.name);
    const listed =
      names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
    return names.length
      ? `Platform-approved wording in ${listed}, the language${names.length === 1 ? '' : 's'} your households use. You change only the sender name.`
      : '';
  });
  /** Each language's wording with the sender name as typed, so the previews follow the field. */
  protected readonly previews = computed(() =>
    (this.invitation()?.languages ?? []).map((l) => {
      const sms = this.withSender(l.sms);
      return {
        ...l,
        sms,
        smsCharacters: sms.length,
        smsSegments: segments(sms),
        emailFooter: this.withSender(l.emailFooter),
      } satisfies LearningBondInvitationLanguage;
    }),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.invitation().subscribe((r) => {
      if (r.status === 'loaded') {
        this.invitation.set(r.value);
        this.savedSender.set(r.value.senderName);
        this.sender.set(r.value.senderName);
        this.state.set('loaded');
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
    });
  }

  protected save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    const name = this.sender().trim();
    this.api.saveInvitation(name).subscribe((outcome) => {
      this.saving.set(false);
      switch (outcome.status) {
        case 'saved':
          this.error.set(null);
          this.toasts.show({
            tone: 'success',
            title: 'Sender name saved',
            text: `Invitations come from ${name}`,
          });
          this.load();
          break;
        case 'invalid':
          this.error.set(outcome.errors['senderName'] ?? null);
          break;
        case 'forbidden':
          this.state.set('forbidden');
          break;
        default:
          this.toasts.show({
            tone: 'danger',
            title: 'Sender name not saved',
            text: 'Something went wrong. Try again.',
          });
      }
    });
  }

  /** The saved sender opens every text and email footer; swap it for what is typed. */
  private withSender(text: string): string {
    const saved = this.savedSender();
    return saved && text.startsWith(saved) ? this.sender() + text.slice(saved.length) : text;
  }
}

function segments(text: string): number {
  const gsm = [...text].every((c) => GSM7.includes(c));
  const [single, multi] = gsm ? [160, 153] : [70, 67];
  return text.length <= single ? 1 : Math.ceil(text.length / multi);
}
