import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PhPageHeader } from '@promisehub/components';
import { SiteState } from '../site-state';

/** Privacy and safeguarding (mock: site-privacy): fixed text with the organization's name (ADR 0075). */
@Component({
  selector: 'ph-site-privacy-page',
  imports: [RouterLink, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-privacy-page.html',
  styleUrl: './site-privacy-page.css',
})
export class SitePrivacyPage {
  protected readonly state = inject(SiteState);

  constructor() {
    this.state.useTitle('Privacy');
  }
}
