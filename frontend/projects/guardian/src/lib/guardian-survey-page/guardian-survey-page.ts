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
import { GUARDIAN_API, GuardianPageResult, GuardianSurvey } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhCard,
  PhEmptyState,
  PhGuardianShell,
  PhRadioGroup,
  PhTextField,
  PhTextarea,
  RadioOption,
  PhInlineMessage,
} from '@promisehub/components';
import { GuardianLanguage, guardianText } from '../guardian-text';
import { surveyText } from '../survey-text';

type Step = 'contact' | 'code' | 'locked';

/** The guardian's survey page (mock: survey): verify the device, rate 1 to 5, add a comment, send once (L2-043). */
@Component({
  selector: 'ph-guardian-survey-page',
  imports: [
    PhInlineMessage,
    FormsModule,
    PhAlert,
    PhButton,
    PhCard,
    PhEmptyState,
    PhGuardianShell,
    PhRadioGroup,
    PhTextField,
    PhTextarea,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guardian-survey-page.html',
})
export class GuardianSurveyPage {
  private readonly api = inject(GUARDIAN_API);
  private readonly document = inject(DOCUMENT);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<GuardianSurvey> | null>(null);
  protected readonly step = signal<Step>('contact');
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  protected contact = '';
  protected code = '';
  protected rating = '';
  protected comment = '';

  protected readonly language = computed<GuardianLanguage>(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.language : r?.status === 'verify' ? r.language : 'en';
  });
  protected readonly t = computed(() => guardianText(this.language()));
  protected readonly s = computed(() => surveyText(this.language()));
  protected readonly organization = computed(() => {
    const r = this.result();
    if (r?.status === 'loaded') return r.value.organization;
    return r?.status === 'verify' || r?.status === 'gone' ? r.organization : null;
  });
  protected readonly phone = computed(() => {
    const r = this.result();
    if (r?.status === 'loaded') return r.value.organizationPhone;
    return r?.status === 'verify' || r?.status === 'gone' ? r.phone : null;
  });
  protected readonly scale: RadioOption[] = [1, 2, 3, 4, 5].map((n) => ({
    value: String(n),
    label: String(n),
  }));

  constructor() {
    const html = this.document.documentElement;
    inject(DestroyRef).onDestroy(() => html.setAttribute('lang', 'en'));
    effect(() => html.setAttribute('lang', this.language()));
    effect(() => this.load(this.token()));
  }

  protected load(token: string): void {
    this.api.survey(token).subscribe((r) => this.result.set(r));
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
      if (r.status === 'verified' || r.status === 'gone') this.load(this.token());
      else if (r.status === 'invalid') this.errors.set({ code: r.message });
      else if (r.status === 'locked') this.step.set('locked');
      else this.failed.set(true);
    });
  }

  protected send(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api
      .answerSurvey(this.token(), this.rating ? Number(this.rating) : null, this.comment)
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved' || outcome.status === 'not-found') this.load(this.token());
        else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
        else this.failed.set(true);
      });
  }
}
