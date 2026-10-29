import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PhButton, PhCard, PhDialogs, PhPageHeader, ToastService } from '@promisehub/components';
import { SiteState } from '../site-state';
import { VolunteerDialog } from '../volunteer-dialog/volunteer-dialog';

/**
 * Get involved (mock: site-get-involved, L2-134): volunteer (a dialog with the screening acknowledgement), give monthly (a dialog that
 * hands over to the payment provider) and ask a question.
 */
@Component({
  selector: 'ph-site-get-involved-page',
  imports: [PhButton, PhCard, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-get-involved-page.html',
  styleUrl: './site-get-involved-page.css',
})
export class SiteGetInvolvedPage {
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);
  protected readonly state = inject(SiteState);

  constructor() {
    this.state.useTitle('Get involved');
  }

  protected volunteer(): void {
    this.dialogs
      .open<boolean, string, VolunteerDialog>(VolunteerDialog, this.state.slug())
      .closed.subscribe((sent) => {
        if (!sent) return;
        this.toasts.show({
          tone: 'success',
          title: 'Thanks for offering to help',
          text: 'We’ll be in touch about next steps, including screening.',
        });
      });
  }
}
