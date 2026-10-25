import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PhButton, PhErrorPage } from '@promisehub/components';

/** Full-page error (mock: offline). */
@Component({
  selector: 'ph-offline-page',
  imports: [PhButton, PhErrorPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './offline-page.html',
})
export class OfflinePage {
  protected retry(): void {
    window.location.reload();
  }
}
