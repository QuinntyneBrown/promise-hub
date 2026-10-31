import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LEARNING_BOND_API, LearningBondMissingContact } from '@promisehub/api';
import {
  BreadcrumbItem,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
} from '@promisehub/components';

/**
 * The covered households to collect a contact from (mock: learning-bond-launch, state missing-contacts; L2-140 criterion 1): each by
 * name, primary guardian and programs, linking to the household. No number or email appears.
 */
@Component({
  selector: 'ph-learning-bond-missing-contacts-page',
  imports: [
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-missing-contacts-page.html',
  styleUrl: './learning-bond-missing-contacts-page.css',
})
export class LearningBondMissingContactsPage {
  private readonly api = inject(LEARNING_BOND_API);

  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Settings', link: '/settings/organization' },
    { label: 'Learning Bond', link: '/settings/learning-bond' },
    { label: 'Launch', link: '/settings/learning-bond/launch' },
    { label: 'Households to collect from' },
  ];
  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly households = signal<LearningBondMissingContact[]>([]);
  protected readonly subtitle = computed(() => {
    const n = this.households().length;
    return this.state() !== 'loaded'
      ? ''
      : `${n} covered ${n === 1 ? 'household has' : 'households have'} no guardian with a mobile number or email. Collect one at check-in; they’re invited on the next run.`;
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.missingContacts().subscribe((r) => {
      if (r.status === 'loaded') {
        this.households.set(r.value);
        this.state.set('loaded');
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
    });
  }

  protected meta(h: LearningBondMissingContact): string {
    return h.guardian ? `${h.guardian} · ${h.programs}` : h.programs;
  }
}
