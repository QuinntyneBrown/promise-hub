import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LEARNING_API,
  OnboardingAnswers,
  OnboardingProgram,
  OnboardingResult,
} from '@promisehub/api';
import {
  ErrorSummaryItem,
  Fact,
  PhAlert,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhErrorSummary,
  PhPageHeader,
  PhSelect,
  PhSkeleton,
  PhStepper,
  PhSwitch,
  PhTextField,
  SelectOption,
  ToastService,
  formatDate,
} from '@promisehub/components';

const TITLES = ['About you', 'What should we tell you about?', 'Meet your program'];

/**
 * The youth's first-run setup (mock: youth-welcome, L2-059): you, preferences, your program. Every Continue saves the answers
 * with the next step on the server, so Finish later or leaving resumes at that step; Finish completes the setup.
 */
@Component({
  selector: 'ph-youth-welcome-page',
  imports: [
    FormsModule,
    PhAlert,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhErrorSummary,
    PhPageHeader,
    PhSelect,
    PhSkeleton,
    PhStepper,
    PhSwitch,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './youth-welcome-page.html',
  styleUrl: './youth-welcome-page.css',
})
export class YouthWelcomePage {
  private readonly api = inject(LEARNING_API);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly pronounOptions: SelectOption[] = [
    { value: '', label: 'Prefer not to say' },
    { value: 'she/her', label: 'She / her' },
    { value: 'he/him', label: 'He / him' },
    { value: 'they/them', label: 'They / them' },
  ];

  /** Null while loading. */
  protected readonly result = signal<OnboardingResult | null>(null);
  protected readonly step = signal(1);
  protected readonly title = computed(() => TITLES[this.step() - 1]);
  protected readonly greeting = signal('');
  protected readonly program = signal<OnboardingProgram | null>(null);
  protected readonly programFacts = computed<Fact[]>(() => {
    const p = this.program();
    if (!p) return [];
    return [
      { key: 'when', term: 'When', value: p.schedule ?? 'Times to be announced' },
      { key: 'runs', term: 'Runs', value: `${formatDate(p.startsOn)} – ${formatDate(p.endsOn)}` },
    ];
  });
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly summary = computed<ErrorSummaryItem[]>(() =>
    Object.entries(this.errors()).map(([key, message]) => ({ field: this.fieldId(key), message })),
  );
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);

  protected preferredName = '';
  protected pronouns = '';
  protected lessonReminders = true;
  protected mentorMessages = true;
  protected announcements = false;

  constructor() {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.onboarding().subscribe((result) => {
      if (result.status === 'consent-required') {
        void this.router.navigateByUrl('/learning');
        return;
      }
      if (result.status === 'loaded') {
        const s = result.value;
        this.preferredName = s.preferredName;
        this.pronouns = s.pronouns ?? '';
        this.lessonReminders = s.lessonReminders;
        this.mentorMessages = s.mentorMessages;
        this.announcements = s.announcements;
        this.greeting.set(s.preferredName);
        this.program.set(s.program);
        this.step.set(s.status === 'completed' ? 1 : s.step);
      }
      this.result.set(result);
    });
  }

  protected continue(): void {
    this.save(this.step() + 1, () => this.step.update((s) => s + 1));
  }

  /** Saves what is on screen at the current step, so Learning offers to resume here (L2-059 criterion 4). */
  protected finishLater(): void {
    this.save(this.step(), () => void this.router.navigateByUrl('/learning'));
  }

  protected back(): void {
    this.errors.set({});
    this.failed.set(false);
    this.step.update((s) => Math.max(1, s - 1));
  }

  protected finish(): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.completeOnboarding().subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status !== 'saved') {
        this.failed.set(true);
        return;
      }
      this.toasts.show({
        tone: 'success',
        title: `You’re all set, ${this.preferredName.trim()}`,
        text: 'Welcome to Learning.',
      });
      void this.router.navigateByUrl('/learning');
    });
  }

  private save(next: number, done: () => void): void {
    this.busy.set(true);
    this.failed.set(false);
    this.errors.set({});
    this.api.saveOnboarding(this.answers(next)).subscribe((outcome) => {
      this.busy.set(false);
      if (outcome.status === 'saved') {
        this.greeting.set(this.preferredName.trim());
        done();
      } else if (outcome.status === 'invalid') {
        this.errors.set(outcome.errors);
      } else {
        this.failed.set(true);
      }
    });
  }

  private answers(step: number): OnboardingAnswers {
    return {
      step,
      preferredName: this.preferredName,
      pronouns: (this.pronouns || null) as OnboardingAnswers['pronouns'],
      lessonReminders: this.lessonReminders,
      mentorMessages: this.mentorMessages,
      announcements: this.announcements,
    };
  }

  private fieldId(key: string): string {
    return key === 'pronouns' ? 'welcome-pronouns' : 'welcome-name';
  }
}
