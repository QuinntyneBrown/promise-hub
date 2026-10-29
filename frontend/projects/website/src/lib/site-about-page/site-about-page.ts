import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  Fact,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhList,
  PhListItem,
  PhPageHeader,
} from '@promisehub/components';
import { SiteSection } from '../site-section/site-section';
import { SiteState } from '../site-state';

/** About the organization (mock: site-about, L2-133 criterion 5): its words from the website profile, where to find it and its promise. */
@Component({
  selector: 'ph-site-about-page',
  imports: [PhButton, PhCard, PhDescriptionList, PhList, PhListItem, PhPageHeader, SiteSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-about-page.html',
  styleUrl: './site-about-page.css',
})
export class SiteAboutPage {
  protected readonly state = inject(SiteState);

  protected readonly site = computed(() => {
    const s = this.state.site();
    return s?.status === 'loaded' ? s.value : null;
  });

  protected readonly findUs = computed<Fact[]>(() => {
    const s = this.site();
    if (!s) return [];
    const facts: Fact[] = [{ key: 'where', term: 'Where', value: s.city }];
    if (s.email) facts.push({ key: 'email', term: 'Email', value: s.email });
    return facts;
  });

  constructor() {
    this.state.useTitle('About');
  }
}
