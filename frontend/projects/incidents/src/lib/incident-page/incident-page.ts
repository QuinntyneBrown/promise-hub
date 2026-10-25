import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { INCIDENTS_API, Incident } from '@promisehub/api';
import {
  Fact,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhEmptyState,
  PhPageHeader,
  formatDate,
} from '@promisehub/components';
import { CATEGORY, GUARDIAN, STATUS } from '../incident-labels';

/** One incident (mock: incident): the facts as reported; a reader outside the access rule gets not found (L2-023 criteria 3 and 4). */
@Component({
  selector: 'ph-incident-page',
  imports: [PhBadge, PhBreadcrumb, PhButton, PhCard, PhDescriptionList, PhEmptyState, PhPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incident-page.html',
})
export class IncidentPage {
  private readonly api = inject(INCIDENTS_API);

  readonly id = input.required<string>();

  protected readonly incident = signal<Incident | null>(null);
  protected readonly state = signal<'loading' | 'loaded' | 'not-found' | 'error'>('loading');
  protected readonly status = STATUS;

  constructor() {
    effect(() => this.load(this.id()));
  }

  protected load(id: string): void {
    this.api.get(id).subscribe((r) => {
      if (r.status === 'loaded') {
        this.incident.set(r.value);
        this.state.set('loaded');
      } else this.state.set(r.status === 'not-found' ? 'not-found' : 'error');
    });
  }

  protected title(i: Incident): string {
    return `${CATEGORY[i.category]} · ${i.child}`;
  }

  protected facts(i: Incident): Fact[] {
    return [
      { key: 'when', term: 'When', value: formatDate(i.occurredAt) },
      { key: 'where', term: 'Where', value: i.place },
      { key: 'what', term: 'What happened', value: i.whatHappened },
      { key: 'did', term: 'What was done', value: i.actionTaken },
      { key: 'guardian', term: 'Guardian', value: GUARDIAN[i.guardianContact] },
      { key: 'severity', term: 'Severity', value: i.severity },
    ];
  }

  protected reported(i: Incident): string {
    return `Reported by ${i.reportedBy} · ${formatDate(i.reportedAt)}`;
  }
}
