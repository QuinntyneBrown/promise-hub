import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhList,
  PhListItem,
  PhPageHeader,
  PhSkeleton,
} from '@promisehub/components';
import { ProgramCard } from '../program-card/program-card';
import { SiteSection } from '../site-section/site-section';
import { SiteState } from '../site-state';

/**
 * Programs and open cohorts (mock: site-programs, L2-133 criteria 1 to 3): every current program with Apply, the published learning
 * tracks while Learning is on and the mentorship model while Mentoring is on.
 */
@Component({
  selector: 'ph-site-programs-page',
  imports: [
    PhBadge,
    PhButton,
    PhCard,
    PhEmptyState,
    PhList,
    PhListItem,
    PhPageHeader,
    PhSkeleton,
    ProgramCard,
    SiteSection,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-programs-page.html',
  styleUrl: './site-programs-page.css',
})
export class SiteProgramsPage {
  protected readonly state = inject(SiteState);

  constructor() {
    this.state.useTitle('Programs');
  }
}
