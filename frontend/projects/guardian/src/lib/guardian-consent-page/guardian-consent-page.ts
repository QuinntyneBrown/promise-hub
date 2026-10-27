import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GUARDIAN_API, GuardianConsent, GuardianPageResult } from '@promisehub/api';
import {
  Fact,
  PhAlert,
  PhButton,
  PhCard,
  PhCheckbox,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhGuardianShell,
  PhSelect,
  PhTextField,
  SelectOption,
} from '@promisehub/components';
import { RELATIONSHIPS, consentText } from '../consent-text';
import { GuardianLanguage, guardianText } from '../guardian-text';
import { WithdrawConsentDialog } from '../withdraw-consent-dialog/withdraw-consent-dialog';

type Step = 'contact' | 'code' | 'locked';

const LOCALE: Record<GuardianLanguage, string> = { en: 'en-GB', es: 'es', fr: 'fr-CA' };

/**
 * The guardian consent page (mock: guardian-consent): verify the device with a code, read the organization's wording and
 * consent for a youth with a relationship, a ticked box and a typed name (L2-055, L2-026, L2-027); the record afterwards
 * (L2-058). One primary action per state.
 */
@Component({
  selector: 'ph-guardian-consent-page',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCard,
    PhCheckbox,
    PhDescriptionList,
    PhEmptyState,
    PhGuardianShell,
    PhSelect,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guardian-consent-page.html',
})
export class GuardianConsentPage {
  private readonly api = inject(GUARDIAN_API);
  private readonly document = inject(DOCUMENT);
  private readonly dialogs = inject(PhDialogs);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<GuardianConsent> | null>(null);
  protected readonly step = signal<Step>('contact');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly justSigned = signal(false);
  protected contact = '';
  protected code = '';
  protected name = '';
  protected relationship = '';
  protected agree = false;

  protected readonly language = computed<GuardianLanguage>(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.language : r?.status === 'verify' ? r.language : 'en';
  });
  protected readonly t = computed(() => guardianText(this.language()));
  protected readonly c = computed(() => consentText(this.language()));
  protected readonly organization = computed(() => {
    const r = this.result();
    if (r?.status === 'loaded') return r.value.organization;
    return r?.status === 'verify' || r?.status === 'gone' ? r.organization : null;
  });
  protected readonly phone = computed(() => {
    const r = this.result();
    if (r?.status === 'loaded') return r.value.phone;
    return r?.status === 'verify' || r?.status === 'gone' ? r.phone : null;
  });

  constructor() {
    const html = this.document.documentElement;
    inject(DestroyRef).onDestroy(() => html.setAttribute('lang', 'en'));
    effect(() => html.setAttribute('lang', this.language()));
    effect(() => this.load(this.token()));
  }

  protected load(token: string): void {
    this.api.consent(token).subscribe((r) => this.result.set(r));
  }

  protected relationshipOptions(): SelectOption[] {
    const c = this.c();
    return [
      { value: '', label: c.choose },
      ...RELATIONSHIPS.map((r) => ({ value: r, label: c.relationships[r] ?? r })),
    ];
  }

  protected aboutFacts(s: GuardianConsent): Fact[] {
    const c = this.c();
    return [
      { key: 'youth', term: c.youth, value: `${s.child.name}, ${s.child.age}` },
      { key: 'organization', term: c.organization, value: s.organization },
    ];
  }

  protected recordFacts(s: GuardianConsent): Fact[] {
    const c = this.c();
    const relationship = s.relationship ? (c.relationships[s.relationship] ?? s.relationship) : '';
    return [
      { key: 'signed-by', term: c.signedBy, value: `${s.signedBy} (${relationship})` },
      { key: 'when', term: c.when, value: s.signedAt ? this.when(s.signedAt) : '' },
      { key: 'method', term: c.method, value: c.typed },
      { key: 'reference', term: c.reference, value: s.reference ?? '' },
    ];
  }

  protected when(at: string): string {
    return new Intl.DateTimeFormat(LOCALE[this.language()], {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(at));
  }

  protected requestCode(): void {
    this.busy.set(true);
    this.api.requestCode(this.token(), this.contact).subscribe((r) => {
      this.busy.set(false);
      if (r === 'gone') this.load(this.token());
      else if (r === 'sent') this.step.set('code');
      else this.failed.set(true);
    });
  }

  protected verify(): void {
    this.busy.set(true);
    this.errors.set({});
    this.api.verify(this.token(), this.code).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'verified') this.load(this.token());
      else if (r.status === 'invalid') this.errors.set({ code: r.message });
      else if (r.status === 'locked') this.step.set('locked');
      else if (r.status === 'gone') this.load(this.token());
      else this.failed.set(true);
    });
  }

  /** Confirms in a dialog (dialog: withdraw-consent); afterwards the page shows the withdrawn state with the form. */
  protected withdraw(s: GuardianConsent): void {
    this.dialogs
      .open<
        boolean,
        { token: string; child: string; text: ReturnType<typeof consentText> },
        WithdrawConsentDialog
      >(WithdrawConsentDialog, { token: this.token(), child: s.child.firstName, text: this.c() })
      .closed.subscribe((done) => {
        if (!done) return;
        this.justSigned.set(false);
        this.name = '';
        this.relationship = '';
        this.agree = false;
        this.load(this.token());
      });
  }

  protected give(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api
      .giveConsent(this.token(), {
        name: this.name,
        relationship: this.relationship,
        agree: this.agree,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') {
          this.justSigned.set(true);
          this.load(this.token());
        } else if (outcome.status === 'invalid') {
          this.errors.set(outcome.errors);
        } else if (outcome.status === 'not-found') {
          this.load(this.token());
        } else {
          this.failed.set(true);
        }
      });
  }
}
