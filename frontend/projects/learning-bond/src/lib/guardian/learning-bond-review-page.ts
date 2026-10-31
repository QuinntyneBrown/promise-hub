import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { GuardianPageResult, LEARNING_BOND_API, LearningBondApplication } from '@promisehub/api';
import {
  PhAgentMessage,
  PhAlert,
  PhBadge,
  PhButton,
  PhCard,
  PhDialogs,
  PhEmptyState,
  PhGuardianShell,
  PhList,
  PhListItem,
  PhSkeleton,
  PhStepper,
} from '@promisehub/components';
import { LearningBondAgentBubble } from './learning-bond-agent-bubble';
import { guardianLearningBondText } from './guardian-learning-bond-text';
import { LearningBondApplicationRow } from './learning-bond-application-row';
import { learningBondApplicationRows } from './learning-bond-application-rows';
import { LearningBondFieldData, LearningBondFieldDialog } from './learning-bond-field-dialog';
import {
  LearningBondProviderData,
  LearningBondProviderDialog,
} from './learning-bond-provider-dialog';

/**
 * The review (learning-bond-review, L2-148, L2-149): the recommended provider and why, with Choose another; every field of the pre-filled
 * application, SINs masked and not editable, contact details editable for this application only; and Submit as the only way to send it.
 */
@Component({
  selector: 'ph-learning-bond-review-page',
  imports: [
    PhAgentMessage,
    PhAlert,
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhGuardianShell,
    PhList,
    PhListItem,
    PhSkeleton,
    PhStepper,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-review-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class LearningBondReviewPage implements OnInit {
  private readonly api = inject(LEARNING_BOND_API);
  protected readonly agent = new LearningBondAgentBubble(this.api, inject(PhDialogs), 'Review');
  private readonly dialogs = inject(PhDialogs);

  readonly token = input.required<string>();
  readonly childId = input.required<string>();

  protected readonly result = signal<GuardianPageResult<LearningBondApplication> | null>(null);
  protected readonly busy = signal(false);
  protected readonly outcome = signal<
    'sent' | 'not-sent' | 'stale' | 'incomplete' | 'error' | null
  >(null);
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
    this.api.prepareApplication(this.token(), this.childId()).subscribe((r) => {
      this.result.set(r);
      if (r.status === 'loaded') this.agent.load(this.token());
      if (r.status === 'loaded' && r.value.status === 'Submitted') this.outcome.set('sent');
    });
  }

  protected rows(a: LearningBondApplication): LearningBondApplicationRow[] {
    return learningBondApplicationRows(this.text(), a.firstName, a.fields);
  }

  protected edit(a: LearningBondApplication, row: LearningBondApplicationRow): void {
    const data: LearningBondFieldData = {
      token: this.token(),
      applicationId: a.id,
      field: row.field!,
      label: row.label,
      value: row.value === '—' ? '' : row.value,
      text: this.text(),
    };
    this.dialogs
      .open<LearningBondApplication, LearningBondFieldData, LearningBondFieldDialog>(
        LearningBondFieldDialog,
        data,
      )
      .closed.subscribe((changed) => this.changed(changed));
  }

  protected chooseAnother(a: LearningBondApplication): void {
    const data: LearningBondProviderData = {
      token: this.token(),
      application: a,
      text: this.text(),
    };
    this.dialogs
      .open<LearningBondApplication, LearningBondProviderData, LearningBondProviderDialog>(
        LearningBondProviderDialog,
        data,
      )
      .closed.subscribe((changed) => this.changed(changed));
  }

  protected submit(a: LearningBondApplication): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.outcome.set(null);
    this.api.submitApplication(this.token(), a.id, a.reviewVersion).subscribe((r) => {
      this.busy.set(false);
      this.outcome.set(r.status);
    });
  }

  private changed(changed: LearningBondApplication | undefined): void {
    if (!changed) return;
    this.outcome.set(null);
    this.result.set({ status: 'loaded', value: changed });
  }
}
