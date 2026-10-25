import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SESSION_API } from '@promisehub/api';
import { PhButton, PhCard, PhEmptyState, PhPageHeader } from '@promisehub/components';
import { EMPTY, catchError } from 'rxjs';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Today, the staff home. The walking skeleton shows only its empty state (mock: today/empty). */
@Component({
  selector: 'ph-today-page',
  imports: [PhButton, PhCard, PhEmptyState, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today-page.html',
})
export class TodayPage {
  // The shell shows the server error page when the session cannot load.
  protected readonly session = toSignal(
    inject(SESSION_API)
      .current()
      .pipe(catchError(() => EMPTY)),
  );
  protected readonly firstName = computed(() => this.session()?.personName.split(' ')[0] ?? '');
  protected readonly today = dateFormat.format(new Date());
}
