import type { Route } from '@playwright/test';
import { NOW } from './programs';

export interface FakeMentorCheckIn {
  id: string;
  organizationId: string;
  childId: string;
  youthName: string;
  mentorId: string;
  date: string;
  kind: string;
  engagement: string;
  topics: string | null;
  actionItems: string | null;
  privateNotes: string | null;
  followUpOn: string | null;
  shared: boolean;
  guardianInformed: boolean;
  createdAt: string;
}

const KINDS = ['OneToOne', 'Call', 'Session'];
const ENGAGEMENTS = ['Struggling', 'Low', 'Steady', 'Engaged', 'Thriving'];
/** Today at Harbourview and Northgate (America/Toronto) on the fake clock. */
export const TODAY = '2026-11-05';

/**
 * Mentor check-ins as the API keeps them (L2-090, ADR 0061): read only by the mentor who wrote them. FakeApi checks the Mentoring module,
 * the MentorYouth permission, the organization and the mentor's scope before a call reaches it.
 */
export class FakeMentorCheckIns {
  readonly rows: FakeMentorCheckIn[] = [];
  private next = 1;

  /** Answers every save with 500, to show the failed state. */
  failSaves = false;

  seed(row: Omit<FakeMentorCheckIn, 'id' | 'createdAt' | 'organizationId' | 'topics' | 'actionItems' | 'privateNotes' | 'followUpOn' | 'shared' | 'guardianInformed'> &
    Partial<FakeMentorCheckIn>): void {
    this.rows.push({
      organizationId: 'org-harbourview',
      topics: null,
      actionItems: null,
      privateNotes: null,
      followUpOn: null,
      shared: false,
      guardianInformed: false,
      createdAt: new Date(NOW.getTime() - (100 - this.next) * 1000).toISOString(),
      ...row,
      id: row.id ?? `ci-${this.next++}`,
    });
  }

  /** POST /mentoring/check-ins once the youth is known to be his: each field checked as the server does. */
  log(route: Route, organizationId: string, mentorId: string, child: { id: string; name: string } | null): Promise<void> {
    if (this.failSaves) return route.fulfill({ status: 500 });
    const b = route.request().postDataJSON() as Record<string, unknown>;
    const errors: Record<string, string> = {};
    const date = typeof b['date'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b['date']) ? b['date'] : null;
    if (!child) errors['childId'] = 'Choose a youth.';
    if (!date) errors['date'] = 'Choose the date.';
    else if (date > TODAY) errors['date'] = 'The date can’t be in the future.';
    if (!KINDS.includes(b['kind'] as string)) errors['kind'] = 'Choose how you met.';
    if (!ENGAGEMENTS.includes(b['engagement'] as string)) errors['engagement'] = 'Choose how it went.';
    const text = (key: string): string | null => {
      const v = typeof b[key] === 'string' ? (b[key] as string).trim() : '';
      if (v.length > 2000) errors[key] = 'Keep it to 2,000 characters.';
      return v || null;
    };
    const topics = text('topics');
    const actionItems = text('actionItems');
    const privateNotes = text('privateNotes');
    const followUpOn = typeof b['followUpOn'] === 'string' && b['followUpOn'] ? (b['followUpOn'] as string) : null;
    if (followUpOn && date && followUpOn < date) errors['followUpOn'] = 'The follow-up can’t be before the check-in.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const row: FakeMentorCheckIn = {
      id: `ci-${this.next++}`,
      organizationId,
      childId: child!.id,
      youthName: child!.name,
      mentorId,
      date: date!,
      kind: b['kind'] as string,
      engagement: b['engagement'] as string,
      topics,
      actionItems,
      privateNotes,
      followUpOn,
      shared: !!b['shared'],
      guardianInformed: !!b['guardianInformed'],
      createdAt: new Date(NOW.getTime() + this.next * 1000).toISOString(),
    };
    this.rows.push(row);
    return route.fulfill({ status: 201, json: this.view(row) });
  }

  view(r: FakeMentorCheckIn) {
    return {
      id: r.id,
      childId: r.childId,
      youthName: r.youthName,
      date: r.date,
      kind: r.kind,
      engagement: r.engagement,
      topics: r.topics,
      actionItems: r.actionItems,
      privateNotes: r.privateNotes,
      followUpOn: r.followUpOn,
      shared: r.shared,
      guardianInformed: r.guardianInformed,
      createdAt: r.createdAt,
    };
  }
}
