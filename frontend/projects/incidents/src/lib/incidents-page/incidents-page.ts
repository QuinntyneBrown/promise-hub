import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { INCIDENTS_API, IncidentSummary } from '@promisehub/api';
import {
  PhBadge,
  PhButton,
  PhCard,
  PhEmptyState,
  PhErrorPage,
  PhList,
  PhListItem,
  PhPageHeader,
  formatDate,
} from '@promisehub/components';
import { CATEGORY, STATUS } from '../incident-labels';

/** The incident log (mock: incidents): supervisors see every incident, open first; everyone else sees their own reports (state: forbidden). */
@Component({
  selector: 'ph-incidents-page',
  imports: [PhBadge, PhButton, PhCard, PhEmptyState, PhErrorPage, PhList, PhListItem, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incidents-page.html',
})
export class IncidentsPage {
  private readonly api = inject(INCIDENTS_API);

  protected readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  protected readonly canReadLog = signal(false);
  protected readonly incidents = signal<IncidentSummary[]>([]);
  protected readonly status = STATUS;

  constructor() {
    this.load();
  }

  protected load(): void {
    this.api.list().subscribe((r) => {
      if (r.status !== 'loaded') return this.state.set('error');
      this.canReadLog.set(r.value.canReadLog);
      this.incidents.set(r.value.incidents);
      this.state.set('loaded');
    });
  }

  protected title(i: IncidentSummary): string {
    return `${CATEGORY[i.category]} · ${i.child}`;
  }

  protected meta(i: IncidentSummary): string {
    return `${formatDate(i.occurredAt)} · ${i.severity} · reported by ${i.reportedBy}`;
  }
}
