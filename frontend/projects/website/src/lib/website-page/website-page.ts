import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { LoadResult, PublicSite, WEBSITE_API } from '@promisehub/api';
import {
  PhCard,
  PhEmptyState,
  PhGuardianShell,
  PhPageHeader,
  PhSkeleton,
} from '@promisehub/components';
import { map, startWith, switchMap } from 'rxjs';

/**
 * An organization's public page (mock: website), anonymous and read-only. The slug in the address names the organization;
 * the server answers only while its Public website module is on.
 */
@Component({
  selector: 'ph-website-page',
  imports: [PhCard, PhEmptyState, PhGuardianShell, PhPageHeader, PhSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './website-page.html',
})
export class WebsitePage {
  private readonly api = inject(WEBSITE_API);
  private readonly title = inject(Title);

  /** Null while loading. The route's slug comes from the parent `site/:slug` route. */
  protected readonly result = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((p) => p.get('slug') ?? ''),
      switchMap((slug) => this.api.site(slug).pipe(startWith<LoadResult<PublicSite> | null>(null))),
    ),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const r = this.result();
      if (r?.status === 'loaded') this.title.setTitle(r.value.name);
    });
  }
}
