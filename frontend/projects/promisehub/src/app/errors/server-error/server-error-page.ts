import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PhButton, PhErrorPage } from '@promisehub/components';

/** Full-page error (mock: server-error). */
@Component({
  selector: 'ph-server-error-page',
  imports: [PhButton, PhErrorPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './server-error-page.html',
})
export class ServerErrorPage {
  protected retry(): void {
    window.location.reload();
  }
}
