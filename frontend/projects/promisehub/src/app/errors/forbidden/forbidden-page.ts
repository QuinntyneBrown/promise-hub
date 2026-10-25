import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PhButton, PhErrorPage } from '@promisehub/components';

/** Full-page error (mock: forbidden). */
@Component({
  selector: 'ph-forbidden-page',
  imports: [PhButton, PhErrorPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forbidden-page.html',
})
export class ForbiddenPage {}
