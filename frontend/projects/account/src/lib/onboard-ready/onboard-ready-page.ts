import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ATTENDANCE_API, SESSION_API, SessionSummary } from '@promisehub/api';
import {
  PhAuthCard,
  PhButton,
  PhList,
  PhListItem,
  PhSkipLink,
  PhStepper,
  formatWhen,
} from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';

/** Onboarding, ready (mock: onboard-staff-ready): today's sessions the new worker is on, with one action to open check-in (L2-009 criterion 4). */
@Component({
  selector: 'ph-onboard-ready-page',
  imports: [PhAuthCard, PhButton, PhList, PhListItem, PhSkipLink, PhStepper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onboard-ready-page.html',
})
export class OnboardReadyPage {
  protected readonly me = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  protected readonly sessions = signal<SessionSummary[] | null>(null);
  protected readonly when = formatWhen;

  constructor() {
    inject(ATTENDANCE_API)
      .today()
      .subscribe((r) => this.sessions.set(r.status === 'loaded' ? r.value.sessions : []));
  }
}
