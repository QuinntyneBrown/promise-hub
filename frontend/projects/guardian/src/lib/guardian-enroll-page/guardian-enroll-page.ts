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
import {
  EnrollmentChild,
  EnrollmentDraft,
  EnrollmentPage,
  GUARDIAN_ENROLLMENT_API,
} from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhGuardianShell,
  PhSelect,
  PhSwitch,
  PhTextField,
  SelectOption,
} from '@promisehub/components';
import { enrollText } from '../enroll-text';
import { GuardianLanguage, guardianText } from '../guardian-text';

type Step =
  | 'loading'
  | 'closed'
  | 'gone'
  | 'error'
  | 'contact'
  | 'code'
  | 'locked'
  | 'household'
  | 'children'
  | 'review'
  | 'done';

/**
 * Guardian enrollment (mocks: enroll, enroll-household, enroll-child, enroll-review): verify a contact with a code, then the
 * household, the children with their medical details, and the review with the season consent (L2-013). One primary action per step.
 */
@Component({
  selector: 'ph-guardian-enroll-page',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhGuardianShell,
    PhSelect,
    PhSwitch,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guardian-enroll-page.html',
  styleUrl: './guardian-enroll-page.scss',
})
export class GuardianEnrollPage {
  private readonly api = inject(GUARDIAN_ENROLLMENT_API);
  private readonly document = inject(DOCUMENT);

  readonly slug = input.required<string>();

  protected readonly step = signal<Step>('loading');
  protected readonly page = signal<EnrollmentPage | null>(null);
  protected readonly language = signal<GuardianLanguage>('en');
  protected readonly returning = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly result = signal<{
    status: 'WaitingReview' | 'Waitlisted';
    position: number | null;
  } | null>(null);
  protected contact = '';
  protected code = '';
  protected consent = false;
  protected household: EnrollmentDraft['household'] = {
    guardianName: '',
    mobile: '',
    email: '',
    language: 'English',
  };
  protected children: EnrollmentChild[] = [];

  protected readonly t = computed(() => enrollText(this.language()));
  protected readonly g = computed(() => guardianText(this.language()));
  protected readonly languages: SelectOption[] = [
    { value: 'English', label: 'English' },
    { value: 'Spanish', label: 'Español' },
    { value: 'French', label: 'Français' },
  ];

  constructor() {
    const html = this.document.documentElement;
    inject(DestroyRef).onDestroy(() => html.setAttribute('lang', 'en'));
    effect(() => html.setAttribute('lang', this.language()));
    effect(() => this.load(this.slug()));
  }

  protected load(slug: string): void {
    this.api.page(slug).subscribe((r) => {
      if (r.status !== 'loaded') return this.step.set(r.status === 'not-found' ? 'gone' : 'error');
      this.page.set(r.value);
      if (!r.value.open) return this.step.set('closed');
      this.api
        .draft(slug)
        .subscribe((d) =>
          d.status === 'loaded' ? this.useDraft(d.value) : this.step.set('contact'),
        );
    });
  }

  protected requestCode(): void {
    this.busy.set(true);
    this.errors.set({});
    this.api.requestCode(this.slug(), this.contact).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') this.step.set('code');
      else if (outcome.status === 'invalid') this.errors.set(outcome.errors);
      else this.failed.set(true);
    });
  }

  protected verify(): void {
    this.busy.set(true);
    this.errors.set({});
    this.api.verify(this.slug(), this.contact, this.code).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'verified') {
        this.api
          .draft(this.slug())
          .subscribe((d) =>
            d.status === 'loaded' ? this.useDraft(d.value) : this.failed.set(true),
          );
      } else if (r.status === 'invalid') {
        this.errors.set({ code: r.message });
      } else if (r.status === 'locked') {
        this.step.set('locked');
      } else {
        this.failed.set(true);
      }
    });
  }

  protected toChildren(): void {
    this.save((errors) => {
      const own = Object.fromEntries(
        Object.entries(errors).filter(([k]) => k === 'guardianName' || k === 'mobile'),
      );
      if (Object.keys(own).length) return this.errors.set(own);
      this.errors.set({});
      if (!this.children.length) this.addChild();
      this.step.set('children');
    });
  }

  protected toReview(): void {
    this.save((errors) => {
      if (Object.keys(errors).length) return this.errors.set(errors);
      this.errors.set({});
      this.step.set('review');
    });
  }

  protected addChild(): void {
    this.children = [
      ...this.children,
      {
        id: null,
        firstName: '',
        lastName: '',
        dateOfBirth: null,
        school: null,
        allergies: null,
        medication: null,
        enroll: true,
      },
    ];
  }

  protected submit(): void {
    this.busy.set(true);
    this.errors.set({});
    this.api.submit(this.slug(), this.consent).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'submitted') {
        this.result.set(r.value);
        this.step.set('done');
      } else if (r.status === 'invalid') {
        this.errors.set(r.errors);
      } else {
        this.failed.set(true);
      }
    });
  }

  protected enrolled(): EnrollmentChild[] {
    return this.children.filter((c) => c.enroll);
  }

  protected names(): string {
    const names = this.enrolled().map((c) => c.firstName);
    return names.length > 1
      ? `${names.slice(0, -1).join(', ')} ${this.t().and} ${names[names.length - 1]}`
      : (names[0] ?? '');
  }

  protected firstName(): string {
    return (this.household.guardianName ?? '').trim().split(' ')[0] ?? '';
  }

  protected you() {
    return [
      { key: 'name', term: this.t().nameLabel, value: this.household.guardianName ?? '' },
      {
        key: 'contact',
        term: this.t().mobileLabel,
        value: [this.household.mobile, this.household.email].filter(Boolean).join(' · '),
      },
    ];
  }

  private useDraft(
    draft: EnrollmentDraft & { returning: boolean; language: GuardianLanguage },
  ): void {
    this.household = { ...draft.household };
    this.children = draft.children.map((c) => ({ ...c }));
    this.returning.set(draft.returning);
    this.language.set(draft.language);
    this.step.set('household');
  }

  private save(then: (errors: Record<string, string>) => void): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .save(this.slug(), { household: this.household, children: this.children })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') then({});
        else if (outcome.status === 'invalid') then(outcome.errors);
        else this.failed.set(true);
      });
  }
}
