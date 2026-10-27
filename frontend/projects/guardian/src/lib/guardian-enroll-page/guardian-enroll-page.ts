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
  EnrollmentApplicant,
  EnrollmentChild,
  EnrollmentDraft,
  EnrollmentPage,
  EnrollmentReferrer,
  EnrollmentSavedDraft,
  EnrollmentSubmitted,
  GUARDIAN_ENROLLMENT_API,
} from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhGuardianShell,
  PhRadioGroup,
  PhSelect,
  PhSwitch,
  PhTextField,
  PhTextarea,
  RadioOption,
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
  | 'referrer'
  | 'youth'
  | 'household'
  | 'children'
  | 'review'
  | 'done';

/**
 * Enrollment through a program's link (mocks: enroll, enroll-youth, enroll-household, enroll-child, enroll-review): who is
 * applying, verify a contact with a code, then for a guardian the household, the children with their medical details and the
 * review with the season consent (L2-013); for a young person their details and reason, their guardian and the review with
 * the agreement they can give (L2-071). One primary action per step.
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
    PhRadioGroup,
    PhSelect,
    PhSwitch,
    PhTextField,
    PhTextarea,
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
  protected readonly result = signal<EnrollmentSubmitted | null>(null);
  protected readonly applyingAs = signal<EnrollmentApplicant>('Guardian');
  protected reason = '';
  protected referrer: EnrollmentReferrer = { name: '', role: '', organization: '' };
  /** The contact verified with the code, shown on the referrer's step. */
  protected readonly verifiedContact = signal('');
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
  protected readonly applicants = computed<RadioOption[]>(() => {
    const t = this.t();
    return [
      { value: 'Guardian', label: t.asGuardian, hint: t.asGuardianHint },
      { value: 'Youth', label: t.asYouth, hint: t.asYouthHint },
      { value: 'Referrer', label: t.asReferrer, hint: t.asReferrerHint },
    ];
  });
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

  protected fromHousehold(): void {
    if (this.applyingAs() === 'Guardian') this.toChildren();
    else this.toReview();
  }

  /** The referrer's own step: name, role and organization, checked on the server before the young person's step. */
  protected toYoungPerson(): void {
    this.save((errors) => {
      const own = Object.fromEntries(
        Object.entries(errors).filter(([k]) => k.startsWith('referrer')),
      );
      if (Object.keys(own).length) return this.errors.set(own);
      this.errors.set({});
      this.step.set('youth');
    });
  }

  /** The young person's step: their details and reason, checked on the server before their guardian's step. */
  protected toGuardian(): void {
    this.save((errors) => {
      const own = Object.fromEntries(
        Object.entries(errors).filter(([k]) => k.startsWith('children') || k === 'reason'),
      );
      if (Object.keys(own).length) return this.errors.set(own);
      this.errors.set({});
      this.step.set('household');
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

  protected back(): void {
    if (this.step() === 'review') {
      this.step.set(this.applyingAs() === 'Guardian' ? 'children' : 'household');
    } else if (this.step() === 'household' && this.applyingAs() !== 'Guardian') {
      this.step.set('youth');
    } else if (this.step() === 'youth') {
      this.step.set('referrer');
    } else {
      this.step.set('household');
    }
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
    const path = this.applyingAs();
    const name =
      path === 'Youth'
        ? (this.children[0]?.firstName ?? '')
        : path === 'Referrer'
          ? this.referrer.name
          : this.household.guardianName;
    return (name ?? '').trim().split(' ')[0] ?? '';
  }

  /** The young person's full name, for the review and the submitted state. */
  protected applicantName(): string {
    const c = this.children[0];
    return c ? `${c.firstName} ${c.lastName}`.trim() : '';
  }

  /** The review of a young person's application, or of a referral. */
  protected application() {
    const t = this.t();
    const by = [this.referrer.role, this.referrer.organization].filter(Boolean).join(', ');
    const lead =
      this.applyingAs() === 'Referrer'
        ? [
            {
              key: 'by',
              term: t.factReferredBy,
              value: [this.referrer.name, by].filter(Boolean).join(' · '),
            },
            { key: 'person', term: t.factYoungPerson, value: this.applicantName() },
          ]
        : [{ key: 'you', term: t.factYou, value: this.applicantName() }];
    return [
      ...lead,
      { key: 'why', term: t.factWhy, value: this.reason },
      { key: 'guardian', term: t.factGuardian, value: this.guardianLine() },
    ];
  }

  /** Under 18 the young person agrees to the privacy notice; at 18 they give the season consent themselves. */
  protected agreement(): string {
    const t = this.t();
    if (this.applyingAs() === 'Guardian') return t.consent;
    if (this.applyingAs() === 'Referrer') return t.referrerAgree;
    const born = this.children[0]?.dateOfBirth;
    return born && this.age(born) >= 18 ? t.consent : t.youthAgree;
  }

  private guardianLine(): string {
    const contact = [this.household.mobile, this.household.email].filter(Boolean).join(' · ');
    return [this.household.guardianName, contact].filter(Boolean).join(' · ');
  }

  private age(dateOfBirth: string): number {
    const [y, m, d] = dateOfBirth.split('-').map(Number) as [number, number, number];
    const today = new Date();
    const before = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
    return today.getFullYear() - y - (before ? 1 : 0);
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

  private useDraft(draft: EnrollmentSavedDraft): void {
    this.verifiedContact.set(draft.contact);
    const saved = draft.applyingAs ?? 'Guardian';
    if (saved !== 'Guardian') this.applyingAs.set(saved);
    if (this.applyingAs() !== 'Guardian' && saved === 'Guardian') {
      this.household = { guardianName: '', mobile: '', email: '', language: 'English' };
      this.children = [];
      this.addChild();
      this.returning.set(false);
      this.step.set(this.applyingAs() === 'Referrer' ? 'referrer' : 'youth');
      return;
    }
    this.household = { ...draft.household };
    this.children = draft.children.map((c) => ({ ...c }));
    this.reason = draft.reason ?? '';
    this.referrer = { name: '', role: '', organization: '', ...draft.referrer };
    this.returning.set(draft.returning);
    this.language.set(draft.language);
    this.step.set(
      { Guardian: 'household', Youth: 'youth', Referrer: 'referrer' }[this.applyingAs()] as Step,
    );
  }

  private save(then: (errors: Record<string, string>) => void): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api
      .save(this.slug(), {
        applyingAs: this.applyingAs(),
        reason: this.applyingAs() === 'Guardian' ? null : this.reason,
        referrer: this.applyingAs() === 'Referrer' ? this.referrer : null,
        household: this.household,
        children: this.children,
      })
      .subscribe((outcome) => {
        this.busy.set(false);
        if (outcome.status === 'saved') then({});
        else if (outcome.status === 'invalid') then(outcome.errors);
        else this.failed.set(true);
      });
  }
}
