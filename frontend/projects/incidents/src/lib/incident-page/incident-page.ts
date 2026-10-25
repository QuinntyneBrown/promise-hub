import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { INCIDENTS_API, Incident } from '@promisehub/api';
import {
  Fact,
  PhAlert,
  PhBadge,
  PhBreadcrumb,
  PhButton,
  PhCard,
  PhDescriptionList,
  PhDialogs,
  PhEmptyState,
  PhPageHeader,
  PhTimeline,
  TimelineEntry,
  ToastService,
  formatDate,
  formatDateTime,
} from '@promisehub/components';
import { AddFollowUpDialog } from '../add-follow-up-dialog/add-follow-up-dialog';
import { ReopenIncidentDialog } from '../reopen-incident-dialog/reopen-incident-dialog';
import { ReviewIncidentDialog } from '../review-incident-dialog/review-incident-dialog';
import { CATEGORY, GUARDIAN, STATUS } from '../incident-labels';

/**
 * One incident (mock: incident, states default and reviewed): the facts as reported, the review, follow-ups and the trail;
 * supervisors mark it reviewed or reopen it; a reader outside the access rule gets not found (L2-023 criteria 2 to 4).
 */
@Component({
  selector: 'ph-incident-page',
  imports: [
    PhAlert,
    PhBadge,
    PhBreadcrumb,
    PhButton,
    PhCard,
    PhDescriptionList,
    PhEmptyState,
    PhPageHeader,
    PhTimeline,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incident-page.html',
})
export class IncidentPage {
  private readonly api = inject(INCIDENTS_API);
  private readonly dialogs = inject(PhDialogs);
  private readonly toasts = inject(ToastService);

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

  protected followUps(i: Incident): TimelineEntry[] {
    return i.followUps.map((f, n) => ({
      key: `f${n}`,
      actor: f.by,
      text: f.text,
      meta: formatDateTime(f.at),
    }));
  }

  protected trail(i: Incident): TimelineEntry[] {
    return i.trail.map((t, n) => {
      const [actor, ...rest] = t.text.split(/ (?=submitted|opened|reviewed|reopened|added)/);
      return { key: `t${n}`, actor: actor ?? '', text: rest.join(' '), meta: formatDateTime(t.at) };
    });
  }

  protected review(i: Incident): void {
    this.dialogs
      .open<boolean, { id: string; reporter: string }, ReviewIncidentDialog>(ReviewIncidentDialog, {
        id: i.id,
        reporter: i.reportedBy,
      })
      .closed.subscribe((done) => this.done(done, 'Marked reviewed', `${i.reportedBy} is told.`));
  }

  protected addFollowUp(i: Incident): void {
    this.dialogs
      .open<boolean, { id: string }, AddFollowUpDialog>(AddFollowUpDialog, { id: i.id })
      .closed.subscribe((done) => this.done(done, 'Follow-up added', 'It stays on the report.'));
  }

  protected reopen(i: Incident): void {
    this.dialogs
      .open<boolean, { id: string }, ReopenIncidentDialog>(ReopenIncidentDialog, { id: i.id })
      .closed.subscribe((done) => this.done(done, 'Reopened', 'The review note is kept.'));
  }

  private done(done: boolean | undefined, title: string, text: string): void {
    if (!done) return;
    this.toasts.show({ tone: 'success', title, text });
    this.load(this.id());
  }

  protected reviewedOn(at: string): string {
    return formatDate(at);
  }

  protected reported(i: Incident): string {
    return `Reported by ${i.reportedBy} · ${formatDate(i.reportedAt)}`;
  }
}
