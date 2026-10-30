import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { GuardianPageResult, LEARNING_BOND_API, LearningBondEstimate } from '@promisehub/api';
import {
  PhAgentMessage,
  PhAlert,
  PhButton,
  PhCard,
  PhEmptyState,
  PhGuardianShell,
  PhSkeleton,
  PhStepper,
} from '@promisehub/components';
import { guardianLearningBondText } from './guardian-learning-bond-text';

/**
 * The Learning Bond estimate (mock: learning-bond-estimate, L2-147): one "up to" number from the rule and where it comes from; none for a
 * child born before 2004; with no tax return filed, what to do first and no application yet.
 */
@Component({
  selector: 'ph-learning-bond-estimate-page',
  imports: [
    PhAgentMessage,
    PhAlert,
    PhButton,
    PhCard,
    PhEmptyState,
    PhGuardianShell,
    PhSkeleton,
    PhStepper,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-estimate-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondEstimatePage implements OnInit {
  private readonly api = inject(LEARNING_BOND_API);

  readonly token = input.required<string>();
  readonly childId = input.required<string>();

  protected readonly result = signal<GuardianPageResult<LearningBondEstimate> | null>(null);
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

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.estimate(this.token(), this.childId()).subscribe((r) => this.result.set(r));
  }
}
