import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PhAuthCard, PhButton, PhSkipLink } from '@promisehub/components';

/** Signed out (mock: signed-out): the session has ended on the server and the device keeps none of the person's data. */
@Component({
  selector: 'ph-signed-out-page',
  imports: [PhAuthCard, PhButton, PhSkipLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signed-out-page.html',
})
export class SignedOutPage {}
