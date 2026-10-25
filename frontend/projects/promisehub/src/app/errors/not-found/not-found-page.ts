import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PhButton, PhErrorPage } from '@promisehub/components';

/** Full-page error (mock: not-found). */
@Component({
  selector: 'ph-not-found-page',
  imports: [PhButton, PhErrorPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found-page.html',
})
export class NotFoundPage {}
