import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PhButton, PhErrorPage } from '@promisehub/components';

/** Full-page error (mock: maintenance). */
@Component({
  selector: 'ph-maintenance-page',
  imports: [PhButton, PhErrorPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './maintenance-page.html',
})
export class MaintenancePage {
  protected retry(): void {
    window.location.reload();
  }
}
