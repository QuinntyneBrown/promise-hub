import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GuardianPageResult,
  LEARNING_BOND_API,
  LearningBondConsentPage as ConsentPage,
} from '@promisehub/api';
import {
  ErrorSummaryItem,
  PhAgentMessage,
  PhAlert,
  PhButton,
  PhCard,
  PhCheckbox,
  PhEmptyState,
  PhErrorSummary,
  PhGuardianShell,
  PhSkeleton,
  PhTextField,
} from '@promisehub/components';
import { guardianLearningBondText } from './guardian-learning-bond-text';

/**
 * Learning Bond consent (mock: learning-bond-consent, L2-145): one unticked box per child with the exact wording, the guardian's typed full
 * name and Agree. Each ticked child gets its own consent; nothing is asked about a child left unticked.
 */
@Component({
  selector: 'ph-learning-bond-consent-page',
  imports: [
    FormsModule,
    PhAgentMessage,
    PhAlert,
    PhButton,
    PhCard,
    PhCheckbox,
    PhEmptyState,
    PhErrorSummary,
    PhGuardianShell,
    PhSkeleton,
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-consent-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondConsentPage implements OnInit {
  private readonly api = inject(LEARNING_BOND_API);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<ConsentPage> | null>(null);
  protected readonly ticked = signal<string[]>([]);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly recorded = signal<string[]>([]);
  protected typedName = '';

  protected readonly language = computed(() => {
    const r = this.result();
    return r?.status === 'loaded' ? r.value.language : r?.status === 'verify' ? r.language : 'en';
  });
  protected readonly text = computed(() => guardianLearningBondText(this.language()));
  protected readonly organization = computed(() => {
    const r = this.result();
    if (r?.status === 'loaded') return r.value.organization;
    return r?.status === 'verify' || r?.status === 'gone' ? r.organization : null;
  });
  protected readonly summary = computed<ErrorSummaryItem[]>(() => {
    const e = this.errors();
    return [
      ...(e['children'] ? [{ field: 'consent-children', message: e['children'] }] : []),
      ...(e['typedName'] ? [{ field: 'consent-typed-name', message: e['typedName'] }] : []),
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.consentPage(this.token()).subscribe((r) => this.result.set(r));
  }

  protected toggle(childId: string, on: boolean): void {
    this.ticked.update((ids) =>
      on ? [...ids.filter((id) => id !== childId), childId] : ids.filter((id) => id !== childId),
    );
  }

  protected names(ids: string[]): string {
    const r = this.result();
    const kids =
      r?.status === 'loaded'
        ? r.value.children.filter((c) => ids.includes(c.id)).map((c) => c.firstName)
        : [];
    const and = this.text().and;
    return kids.length <= 1
      ? (kids[0] ?? '')
      : `${kids.slice(0, -1).join(', ')} ${and} ${kids.at(-1)}`;
  }

  protected firstName(): string {
    return this.typedName.trim().split(/\s+/)[0] ?? '';
  }

  protected agree(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.failed.set(false);
    const ids = this.ticked();
    this.api.giveConsent(this.token(), ids, this.typedName).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'saved') {
        this.errors.set({});
        this.recorded.set(ids);
      } else if (r.status === 'invalid') {
        this.errors.set(r.errors);
      } else {
        this.failed.set(true);
      }
    });
  }
}
