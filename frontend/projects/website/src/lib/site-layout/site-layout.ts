import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import {
  PhCard,
  PhEmptyState,
  PhSiteFooter,
  PhSiteNav,
  PhSkeleton,
  PhSkipLink,
  SiteLink,
} from '@promisehub/components';
import { distinctUntilChanged, map } from 'rxjs';
import { SiteState } from '../site-state';

/**
 * The public website's frame (mocks: every `site-*` page, L2-132): the site nav, one wide column and the site footer. Reads the site
 * once for the address in the route and shares it with every page through `SiteState`.
 */
@Component({
  selector: 'ph-site-layout',
  imports: [RouterOutlet, PhCard, PhEmptyState, PhSiteFooter, PhSiteNav, PhSkeleton, PhSkipLink],
  providers: [SiteState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-layout.html',
  styleUrl: './site-layout.css',
})
export class SiteLayout {
  protected readonly state = inject(SiteState);

  protected readonly links = computed<SiteLink[]>(() => [
    { label: 'Programs', link: this.state.link('programs') },
    { label: 'About', link: this.state.link('about') },
    { label: 'Get involved', link: this.state.link('get-involved') },
    { label: 'Contact', link: this.state.link('contact') },
  ]);
  protected readonly footerLinks = computed<SiteLink[]>(() => [
    ...this.links(),
    { label: 'Privacy', link: this.state.link('privacy') },
  ]);

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((p) => p.get('slug') ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((slug) => this.state.load(slug));
  }
}
