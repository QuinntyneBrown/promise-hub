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
import { GUARDIAN_API, GuardianAnswers, GuardianSlip, GuardianSlipResult } from '@promisehub/api';
import {
  Fact,
  PhAlert,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhGuardianShell,
  PhRadioGroup,
  PhTextField,
  RadioOption,
} from '@promisehub/components';
import { DeclineSlipDialog } from '../decline-slip-dialog/decline-slip-dialog';
import { GuardianLanguage, guardianText, longDate, timeRange } from '../guardian-text';

type Step = 'contact' | 'code' | 'locked';

/**
 * The guardian's slip page (mock: slip-sign): verify the device with a code, check the child's details, answer the
 * questions and sign with a typed name, or decline (L2-015, L2-026, L2-027). One primary action per state.
 */
@Component({
  selector: 'ph-guardian-slip-page',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhGuardianShell,
    PhRadioGroup,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guardian-slip-page.html',
})
export class GuardianSlipPage {
  private readonly api = inject(GUARDIAN_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly document = inject(DOCUMENT);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianSlipResult | null>(null);
  protected readonly step = signal<Step>('contact');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected readonly justSigned = signal(false);
  protected contact = '';
  protected code = '';
  protected name = '';
  protected photos = 'yes';
  protected lunch = 'pack';
  protected swimming = 'yes';

  protected readonly language = computed<GuardianLanguage>(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.language : r?.status === 'verify' ? r.language : 'en';
  });
  protected readonly t = computed(() => guardianText(this.language()));
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
    this.api.slip(token).subscribe((r) => this.result.set(r));
  }

  protected facts(s: GuardianSlip): Fact[] {
    const t = this.t();
    return [
      { key: 'child', term: t.childLabel, value: `${s.child.name}, ${s.child.age}` },
      { key: 'allergies', term: t.allergies, value: s.child.allergies ?? t.none },
      { key: 'medication', term: t.medication, value: s.child.medication ?? t.none },
      {
        key: 'emergency',
        term: t.emergency,
        value: s.emergencyContact
          ? [s.emergencyContact.name, s.emergencyContact.phone].filter(Boolean).join(' · ')
          : t.none,
      },
    ];
  }

  protected when(s: GuardianSlip): string {
    return `${longDate(s.event.startsAt, this.language())} · ${timeRange(s.event.startsAt, s.event.endsAt, this.language())}`;
  }

  protected signBy(s: GuardianSlip): string {
    return longDate(s.signBy, this.language());
  }

  protected photoOptions(s: GuardianSlip): RadioOption[] {
    return [
      { value: 'yes', label: this.t().photosYes },
      { value: 'no', label: this.t().photosNo(s.child.firstName) },
    ];
  }

  protected lunchOptions(): RadioOption[] {
    return [
      { value: 'pack', label: this.t().lunchPack },
      { value: 'provide', label: this.t().lunchProvide },
    ];
  }

  protected swimOptions(): RadioOption[] {
    return [
      { value: 'yes', label: this.t().swimYes },
      { value: 'float', label: this.t().swimFloat },
      { value: 'no', label: this.t().swimNo },
    ];
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

  protected sign(s: GuardianSlip): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    const answers: GuardianAnswers = {
      name: this.name,
      photos: s.askPhotos ? this.photos === 'yes' : null,
      lunch: s.askLunch ? (this.lunch as GuardianAnswers['lunch']) : null,
      swimming: s.askSwimming ? (this.swimming as GuardianAnswers['swimming']) : null,
    };
    this.api.sign(this.token(), answers).subscribe((outcome) => {
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

  protected decline(s: GuardianSlip): void {
    this.dialogs
      .open<string, { child: string; text: ReturnType<typeof guardianText> }, DeclineSlipDialog>(
        DeclineSlipDialog,
        {
          child: s.child.firstName,
          text: this.t(),
        },
      )
      .closed.subscribe((reason) => {
        if (reason === undefined) return;
        this.api.decline(this.token(), this.name, reason).subscribe(() => this.load(this.token()));
      });
  }
}
