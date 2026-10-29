import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { LoadResult, PublicContent, PublicSite, WEBSITE_API } from '@promisehub/api';

/**
 * The public website's data for one address (L2-132, L2-133): the profile and the published content, read once by the layout and shared
 * with every page. Provided by `SiteLayout`.
 */
@Injectable()
export class SiteState {
  private readonly api = inject(WEBSITE_API);
  private readonly title = inject(Title);

  readonly slug = signal('');
  /** Null while loading. */
  readonly site = signal<LoadResult<PublicSite> | null>(null);
  /** Null while loading. */
  readonly content = signal<LoadResult<PublicContent> | null>(null);
  readonly name = computed(() => {
    const s = this.site();
    return s?.status === 'loaded' ? s.value.name : '';
  });

  /** The absolute router link of a page of this site; empty for home. */
  link(page = ''): string[] {
    return page ? ['/site', this.slug(), page] : ['/site', this.slug()];
  }

  /** Keeps the document title as "{page} · {organization}", or the organization alone on home. Call from a page's constructor. */
  useTitle(page: string | null): void {
    effect(() => {
      const name = this.name();
      if (name) this.title.setTitle(page ? `${page} · ${name}` : name);
    });
  }

  load(slug: string): void {
    this.slug.set(slug);
    this.site.set(null);
    this.api.site(slug).subscribe((r) => this.site.set(r));
    this.reloadContent();
  }

  reloadContent(): void {
    this.content.set(null);
    this.api.content(this.slug()).subscribe((r) => this.content.set(r));
  }
}
