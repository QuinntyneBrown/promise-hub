import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PhCard, PhEmptyState, PhGuardianShell, PhPageHeader } from '@promisehub/components';

/** A public website address that answers nothing (mock: website/not-found): unknown, suspended and off look the same. */
@Component({
  selector: 'ph-site-not-found-page',
  imports: [PhCard, PhEmptyState, PhGuardianShell, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-not-found-page.html',
})
export class SiteNotFoundPage {}
