import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  PhButton,
  PhCard,
  PhEmptyState,
  PhPageHeader,
  PhSkeleton,
  PhStat,
} from '@promisehub/components';
import { ProgramCard } from '../program-card/program-card';
import { SiteSection } from '../site-section/site-section';
import { SiteState } from '../site-state';

/** The four steps of joining, the same for every organization (ADR 0075). */
const STEPS = [
  { title: 'Find a program', text: 'Browse what’s running now and who each program is for.' },
  {
    title: 'Apply online',
    text: 'Fill in the program’s enrollment form. It takes about five minutes.',
  },
  { title: 'We say hello', text: 'Our team reviews your application and confirms your place.' },
  {
    title: 'Grow with us',
    text: 'Your child learns, plays and grows with people who know their name.',
  },
];

/** The public website's home (mock: site-landing, L2-133 criterion 4): who the organization is, how to join, what it runs and what is open. */
@Component({
  selector: 'ph-site-landing-page',
  imports: [
    PhButton,
    PhCard,
    PhEmptyState,
    PhPageHeader,
    PhSkeleton,
    PhStat,
    ProgramCard,
    SiteSection,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-landing-page.html',
  styleUrl: './site-landing-page.css',
})
export class SiteLandingPage {
  protected readonly state = inject(SiteState);
  protected readonly steps = STEPS;

  /** Up to three programs open for enrollment. */
  protected readonly open = computed(() => {
    const c = this.state.content();
    return c?.status === 'loaded'
      ? c.value.programs.filter((p) => p.applyPath !== null).slice(0, 3)
      : [];
  });

  constructor() {
    this.state.useTitle(null);
  }
}
