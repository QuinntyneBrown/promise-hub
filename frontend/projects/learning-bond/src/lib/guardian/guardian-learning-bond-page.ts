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
  GUARDIAN_API,
  GuardianLearningBond,
  GuardianLearningBondChild,
  GuardianPageResult,
  LEARNING_BOND_API,
} from '@promisehub/api';
import {
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
  PhTextField,
} from '@promisehub/components';
import { guardianLearningBondText } from './guardian-learning-bond-text';

type Step = 'contact' | 'code' | 'locked';

/**
 * The guardian's Learning Bond page (mock: guardian-learning-bond, L2-144): the device code first on a new device, then the agent's
 * line, each covered child with what they may be owed (or the rule for 18 to 20), Continue, Not now and I'm not interested, in the
 * household's language. No account is needed.
 */
@Component({
  selector: 'ph-guardian-learning-bond-page',
  imports: [
    FormsModule,
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
    PhTextField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guardian-learning-bond-page.html',
  styleUrl: './guardian-learning-bond-page.css',
})
export class GuardianLearningBondPage implements OnInit {
  private readonly api = inject(LEARNING_BOND_API);
  private readonly guardian = inject(GUARDIAN_API);

  readonly token = input.required<string>();

  protected readonly result = signal<GuardianPageResult<GuardianLearningBond> | null>(null);
  protected readonly step = signal<Step>('contact');
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly chosen = signal<'NotNow' | 'NotInterested' | null>(null);
  protected contact = '';
  protected code = '';

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
  protected readonly claimable = computed(() => {
    const r = this.result();
    return r?.status === 'loaded'
      ? r.value.children.filter((c) => !c.selfClaim && c.amount !== null)
      : [];
  });
  protected readonly heading = computed(() => {
    const kids = this.claimable().map((c) => c.firstName);
    const t = this.text();
    if (!kids.length) return t.pageTitle;
    const names =
      kids.length === 1 ? kids[0]! : `${kids.slice(0, -1).join(', ')} ${t.and} ${kids.at(-1)}`;
    return t.heading(names, kids.length > 1);
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.result.set(null);
    this.api.guardianPage(this.token()).subscribe((r) => this.result.set(r));
  }

  /** Where a started claim goes on from (L2-151 criterion 4): its pause, its details, or what happens next. */
  protected resume(c: GuardianLearningBondChild): { label: string; link: string[] } | null {
    const t = this.text();
    const base = ['/g/learning-bond', this.token(), 'children', c.id];
    switch (c.claim) {
      case 'Paused':
        return { label: t.pickUp, link: [...base, 'paused'] };
      case 'Started':
        return { label: t.continueClaim(c.firstName), link: [...base, 'intake'] };
      case 'Submitted':
      case 'Received':
      case 'Deposited':
        return { label: t.seeNext, link: [...base, 'submitted'] };
      default:
        return null;
    }
  }

  protected badge(c: GuardianLearningBondChild): string {
    return this.text().upTo(this.text().amount(c.amount ?? 0));
  }

  protected meta(c: GuardianLearningBondChild): string {
    return c.selfClaim
      ? this.text().selfClaim(c.firstName)
      : [c.age, c.programs.join(', ')].filter((p) => p !== null && p !== '').join(' · ');
  }

  protected choose(choice: 'NotNow' | 'NotInterested'): void {
    this.busy.set(true);
    this.failed.set(false);
    this.api.choose(this.token(), choice).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'saved') this.chosen.set(choice);
      else this.failed.set(true);
    });
  }

  protected requestCode(): void {
    this.busy.set(true);
    this.guardian.requestCode(this.token(), this.contact).subscribe((r) => {
      this.busy.set(false);
      if (r === 'gone') this.load();
      else if (r === 'sent') this.step.set('code');
      else this.failed.set(true);
    });
  }

  protected verify(): void {
    this.busy.set(true);
    this.errors.set({});
    this.guardian.verify(this.token(), this.code).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'verified' || r.status === 'gone') this.load();
      else if (r.status === 'invalid') this.errors.set({ code: r.message });
      else if (r.status === 'locked') this.step.set('locked');
      else this.failed.set(true);
    });
  }
}
