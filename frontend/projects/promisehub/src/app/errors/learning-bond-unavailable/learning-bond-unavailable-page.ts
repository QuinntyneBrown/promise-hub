import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PhCard, PhGuardianShell, PhPageHeader } from '@promisehub/components';

/**
 * A guardian's Learning Bond link that answers 404 (mock: guardian-learning-bond, state unavailable): the module off, a suspended
 * organization and an unknown link look the same and name no organization, and the learning-bond library is never downloaded (L2-162).
 */
@Component({
  selector: 'ph-learning-bond-unavailable-page',
  imports: [PhCard, PhGuardianShell, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-bond-unavailable-page.html',
})
export class LearningBondUnavailablePage {}
