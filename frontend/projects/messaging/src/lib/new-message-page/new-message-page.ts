import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AudienceRequest,
  ChannelChoice,
  EVENTS_API,
  MESSAGING_API,
  MessagePreview,
  PROGRAMS_API,
  SESSION_API,
  SmsCap,
} from '@promisehub/api';
import {
  PhAlert,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhPageHeader,
  PhRadioGroup,
  PhRecipientCount,
  PhSelect,
  PhSmsPreview,
  PhTextarea,
  RadioOption,
  SelectOption,
  ToastService,
} from '@promisehub/components';
import { EMPTY, catchError, combineLatest, map } from 'rxjs';
import { guardians } from '../channel-label';

const MAX_LENGTH = 480;

/**
 * New message (mock: new-message): who (a program or an event, and a language), what and how, with a live recipient count
 * and SMS price from the server (L2-021, L2-022). At the SMS cap the text choices are off and email still sends.
 */
@Component({
  selector: 'ph-new-message-page',
  imports: [
    FormsModule,
    PhAlert,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhPageHeader,
    PhRadioGroup,
    PhRecipientCount,
    PhSelect,
    PhSmsPreview,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-message-page.html',
  styleUrl: './new-message-page.scss',
})
export class NewMessagePage {
  private readonly api = inject(MESSAGING_API);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);
  private readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );

  protected readonly audiences = toSignal(
    combineLatest([
      inject(PROGRAMS_API).list('active'),
      inject(EVENTS_API).list('upcoming', '', ''),
    ]).pipe(
      map(([programs, events]): SelectOption[] => [
        ...(programs.status === 'loaded'
          ? programs.value.programs.map((p) => ({ value: `p:${p.id}`, label: p.name }))
          : []),
        ...(events.status === 'loaded'
          ? events.value.events.map((e) => ({ value: `e:${e.id}`, label: `Event: ${e.name}` }))
          : []),
      ]),
    ),
    { initialValue: [] as SelectOption[] },
  );
  protected readonly languages: SelectOption[] = [
    { value: '', label: 'All languages' },
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'French', label: 'French' },
  ];

  protected readonly audience = signal('');
  protected readonly language = signal('');
  protected readonly body = signal('');
  protected readonly channel = signal<ChannelChoice>('TextWithEmailFallback');
  protected readonly preview = signal<MessagePreview | null>(null);
  protected readonly previewFailed = signal(false);
  protected readonly cap = signal<SmsCap | null>(null);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected readonly atCap = computed(() => this.cap()?.state === 'Reached');
  protected readonly channels = computed<RadioOption[]>(() => [
    {
      value: 'TextWithEmailFallback',
      label: 'Text, email for households without a mobile',
      hint: 'Uses SMS segments',
      disabled: this.atCap(),
    },
    { value: 'EmailOnly', label: 'Email only', hint: 'Free' },
    {
      value: 'TextOnly',
      label: 'Text only',
      hint: 'Skips households without a mobile',
      disabled: this.atCap(),
    },
  ]);
  protected readonly smsText = computed(
    () => `${this.me()?.organizationName ?? ''}: ${this.body().trim()}`,
  );
  protected readonly count = computed(
    () => `${this.preview()?.characters ?? this.smsText().length} / ${MAX_LENGTH}`,
  );
  protected readonly detail = computed(() => {
    const p = this.preview();
    if (!p) return this.previewFailed() ? 'count unavailable' : null;
    const parts = [`${p.textCount} by text, ${p.emailCount} by email`];
    if (p.unreachableCount) parts.push(`${p.unreachableCount} can’t be reached`);
    parts.push(`about ${p.totalSegments} SMS segments`);
    return parts.join(' · ');
  });
  protected readonly warning = computed(() => {
    const p = this.preview();
    if (!p) return null;
    if (p.recipientCount === 0) return 'Nobody matches. Loosen a filter.';
    if (p.fallingBackToEmail) {
      return `This passes the SMS cap: ${p.fallingBackToEmail} households get email instead.`;
    }
    return null;
  });
  protected readonly canSend = computed(() => !!this.preview()?.recipientCount && !this.busy());

  constructor() {
    this.api.smsCap().subscribe((r) => {
      if (r.status !== 'loaded') return;
      this.cap.set(r.value);
      if (r.value.state === 'Reached') this.channel.set('EmailOnly');
    });
    effect(() => {
      const audiences = this.audiences();
      if (!this.audience() && audiences.length) this.audience.set(audiences[0]!.value);
    });
    // The count follows the form, a moment after typing stops.
    effect((onCleanup) => {
      const request = this.request();
      if (!this.audience()) return;
      const timer = setTimeout(() => this.refresh(request), 300);
      onCleanup(() => clearTimeout(timer));
    });
  }

  protected refresh(request = this.request()): void {
    this.api.preview(request).subscribe((r) => {
      this.previewFailed.set(r.status !== 'loaded');
      this.preview.set(r.status === 'loaded' ? r.value : null);
    });
  }

  protected submit(): void {
    if (!this.canSend()) return;
    this.busy.set(true);
    this.failed.set(false);
    const request = this.request();
    this.api.send(request).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        const p = this.preview();
        this.toasts.show({
          tone: 'success',
          title: 'Message sent',
          text: p
            ? `${guardians(p.recipientCount)} · ${p.textCount} text, ${p.emailCount} email`
            : undefined,
        });
        void this.router.navigate(['/messages', outcome.id]);
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }

  private request(): AudienceRequest {
    const [kind, id] = this.audience().split(':');
    return {
      programId: kind === 'p' ? (id ?? null) : null,
      eventId: kind === 'e' ? (id ?? null) : null,
      language: this.language() || null,
      body: this.body(),
      channel: this.channel(),
    };
  }
}
