import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  LEARNING_BOND_API,
  LearningBondOverview,
  ROLE_LABELS,
  Role,
  SESSION_API,
  settingsSections,
} from '@promisehub/api';
import {
  Fact,
  PhAlert,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhPageHeader,
  PhSkeleton,
  PhTabs,
  formatFullDay,
} from '@promisehub/components';
import { map } from 'rxjs';

const LANGUAGE_NAMES: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };

/**
 * Settings › Learning Bond (mock: settings-learning-bond, L2-136 criteria 4 and 9): the agreement, coverage, guardian invitation and
 * launch, each linking to its page. While a new agreement version is pending, Learning Bond stays on and Launch is disabled.
 */
@Component({
  selector: 'ph-settings-learning-bond-page',
  imports: [
    PhAlert,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhPageHeader,
    PhSkeleton,
    PhTabs,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-learning-bond-page.html',
  styleUrl: './settings-learning-bond-page.css',
})
export class SettingsLearningBondPage {
  private readonly api = inject(LEARNING_BOND_API);

  protected readonly sections = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(map((s) => settingsSections(s.modules))),
    { initialValue: settingsSections([]) },
  );
  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly overview = signal<LearningBondOverview | null>(null);

  protected readonly coverageFacts = computed<Fact[]>(() => {
    const o = this.overview();
    if (!o) return [];
    const reach = `${o.households} household${o.households === 1 ? '' : 's'}`;
    return [
      {
        key: 'programs',
        term: 'Programs',
        value:
          o.coverage === 'AllPrograms'
            ? `Every program · ${reach}`
            : `${o.programs.join(', ')} · ${reach}`,
      },
      {
        key: 'who-sees-each-family-s-status',
        term: 'Who sees each family’s status',
        value: o.statusRoles.map((r) => ROLE_LABELS[r as Role] ?? r).join(', '),
      },
    ];
  });

  protected readonly invitationFacts = computed<Fact[]>(() => {
    const o = this.overview();
    if (!o) return [];
    const names = o.languages.map((l) => LANGUAGE_NAMES[l] ?? l);
    const listed =
      names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
    return [
      { key: 'sender-name', term: 'Sender name', value: o.senderName },
      {
        key: 'languages',
        term: 'Languages',
        value: `${listed}, the language${names.length === 1 ? '' : 's'} your households use`,
      },
      { key: 'wording', term: 'Wording', value: 'Platform-approved; only the sender name changes' },
    ];
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.overview().subscribe((r) => {
      if (r.status === 'loaded') {
        this.overview.set(r.value);
        this.state.set('loaded');
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
    });
  }

  protected acceptedLine(o: LearningBondOverview): string {
    const a = o.acceptance!;
    return `Accepted by ${a.acceptedBy} on ${formatFullDay(a.acceptedAt)}, version ${a.version}.`;
  }

  protected pendingText(o: LearningBondOverview): string {
    const earlier = o.acceptance
      ? ` Version ${o.acceptance.version} was accepted by ${o.acceptance.acceptedBy} on ${formatFullDay(o.acceptance.acceptedAt)}.`
      : '';
    return `Version ${o.pendingVersion} took effect ${formatFullDay(o.pendingEffectiveOn!)}.${earlier} Families already in progress continue; no new invitation goes out until it is accepted.`;
  }
}
