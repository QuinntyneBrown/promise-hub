import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { EVENTS_API, REPORTS_API, SurveySent } from '@promisehub/api';
import {
  PhAlert,
  PhButton,
  PhDialog,
  PhSelect,
  SelectOption,
  formatDateTime,
} from '@promisehub/components';
import { map } from 'rxjs';

/** Send a survey (mock: survey): choose a past session; each household gets a link per child. */
@Component({
  selector: 'ph-send-survey-dialog',
  imports: [FormsModule, PhAlert, PhButton, PhDialog, PhSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './send-survey-dialog.html',
})
export class SendSurveyDialog {
  private readonly api = inject(REPORTS_API);
  protected readonly ref = inject<DialogRef<SurveySent>>(DialogRef);

  protected readonly events = toSignal(
    inject(EVENTS_API)
      .list('past', '', '')
      .pipe(
        map((r): SelectOption[] =>
          r.status === 'loaded'
            ? r.value.events.map((e) => ({
                value: e.id,
                label: `${e.name} · ${formatDateTime(e.startsAt)}`,
              }))
            : [],
        ),
      ),
    { initialValue: [] as SelectOption[] },
  );
  protected eventId = '';
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);
  protected readonly error = signal<string | null>(null);

  protected send(): void {
    const id = this.eventId || this.events()[0]?.value;
    if (!id) {
      this.error.set('Choose a session.');
      return;
    }
    this.busy.set(true);
    this.failed.set(false);
    this.api.sendSurvey(id).subscribe((r) => {
      this.busy.set(false);
      if (r.status === 'loaded') this.ref.close(r.value);
      else this.failed.set(true);
    });
  }
}
