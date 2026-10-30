import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LEARNING_BOND_API, LearningBondLaunch } from '@promisehub/api';
import {
  BreadcrumbItem,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhEmptyState,
  PhPageHeader,
  PhSkeleton,
  PhStat,
} from '@promisehub/components';

/** Shown beside a disabled Launch when no covered household has a mobile number (L2-140 criterion 2). */
export const NO_PHONE_NUMBERS =
  'Add guardians’ mobile numbers before launching. Staff can collect them at check-in.';

/**
 * Learning Bond launch (mock: learning-bond-launch, L2-140, ADR 0079): how many covered households there are and how each can be
 * reached, with the households to collect a contact from. Counts only; the missing contacts name households, never a number.
 */
@Component({
  selector: 'ph-learning-bond-launch-page',
  imports: [PhBreadcrumb, PhButton, PhCard, PhEmptyState, PhPageHeader, PhSkeleton, PhStat],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-launch-page.html',
  styleUrl: './learning-bond-launch-page.css',
})
export class LearningBondLaunchPage {
  private readonly api = inject(LEARNING_BOND_API);

  protected readonly crumbs: BreadcrumbItem[] = [
    { label: 'Settings', link: '/settings/organization' },
    { label: 'Learning Bond', link: '/settings/learning-bond' },
    { label: 'Launch' },
  ];
  protected readonly noPhoneNumbers = NO_PHONE_NUMBERS;
  protected readonly state = signal<'loading' | 'loaded' | 'forbidden' | 'error'>('loading');
  protected readonly launch = signal<LearningBondLaunch | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.api.launch().subscribe((r) => {
      if (r.status === 'loaded') {
        this.launch.set(r.value);
        this.state.set('loaded');
      } else {
        this.state.set(r.status === 'forbidden' ? 'forbidden' : 'error');
      }
    });
  }

  protected programsCaption(l: LearningBondLaunch): string {
    return l.programs.join(', ') || 'No program yet';
  }
}
