import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PhButton, PhErrorPage } from '@promisehub/components';

/** Full-page error (mock: server-error). */
@Component({
  selector: 'ph-server-error-page',
  imports: [PhButton, PhErrorPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './server-error-page.html',
})
export class ServerErrorPage {
  /** The reference from the failed request, when the API gave one, so support can find its log line. */
  protected readonly reference: string | null =
    inject(Router).currentNavigation()?.extras.state?.['reference'] ?? null;

  protected retry(): void {
    window.location.reload();
  }
}
