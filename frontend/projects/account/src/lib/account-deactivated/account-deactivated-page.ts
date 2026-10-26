import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PhAuthCard, PhButton, PhSkipLink } from '@promisehub/components';

/** Account inactive (mock: account-deactivated): every membership was removed, so sign-in is refused (L2-050). */
@Component({
  selector: 'ph-account-deactivated-page',
  imports: [PhAuthCard, PhButton, PhSkipLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-deactivated-page.html',
})
export class AccountDeactivatedPage {}
