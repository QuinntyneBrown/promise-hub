import type { Route } from '@playwright/test';
import { NOW } from './programs';

export interface FakeAtRiskFlag {
  id: string;
  organizationId: string;
  childId: string;
  youthName: string;
  raisedById: string;
  raisedBy: string;
  severity: string;
  reason: string;
  raisedAt: string;
  status: 'Open' | 'Resolved';
  outcome: string | null;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

const SEVERITIES = ['Low', 'Medium', 'High'];

/**
 * At-risk flags as the API keeps them (L2-091, ADR 0062). FakeApi checks the Mentoring module, the role, the organization and the mentor's
 * scope before a call reaches it.
 */
export class FakeAtRiskFlags {
  readonly rows: FakeAtRiskFlag[] = [];
  private next = 1;

  /** Answers every save with 500, to show the failed state. */
  failSaves = false;

  seed(row: Pick<FakeAtRiskFlag, 'childId' | 'youthName' | 'raisedById' | 'raisedBy' | 'severity' | 'reason'> & Partial<FakeAtRiskFlag>): void {
    this.rows.push({
      organizationId: 'org-harbourview',
      raisedAt: new Date(NOW.getTime() - (100 - this.next) * 60_000).toISOString(),
      status: 'Open',
      outcome: null,
      resolutionNote: null,
      resolvedBy: null,
      resolvedAt: null,
      ...row,
      id: row.id ?? `flag-${this.next++}`,
    });
  }

  /** Open: High, Medium, Low, then newest; Resolved: newest resolved first. */
  list(visible: FakeAtRiskFlag[], status: string | null) {
    const resolved = status === 'Resolved';
    const items = visible
      .filter((f) => (resolved ? f.status === 'Resolved' : f.status === 'Open'))
      .sort((a, b) =>
        resolved
          ? (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? '')
          : SEVERITIES.indexOf(b.severity) - SEVERITIES.indexOf(a.severity) || b.raisedAt.localeCompare(a.raisedAt),
      );
    return {
      items,
      openCount: visible.filter((f) => f.status === 'Open').length,
      resolvedCount: visible.filter((f) => f.status === 'Resolved').length,
    };
  }

  /** POST /mentoring/flags once the youth is known to be his: each field checked as the server does, one open flag per youth. */
  raise(route: Route, organizationId: string, raiser: { id: string; name: string }, child: { id: string; name: string } | null): Promise<void> {
    if (this.failSaves) return route.fulfill({ status: 500 });
    const b = route.request().postDataJSON() as Record<string, unknown>;
    const errors: Record<string, string> = {};
    if (!child) errors['childId'] = 'Choose a youth.';
    if (!SEVERITIES.includes(b['severity'] as string)) errors['severity'] = 'Choose how serious it is.';
    const reason = typeof b['reason'] === 'string' ? b['reason'].trim() : '';
    if (!reason) errors['reason'] = 'Say why you’re worried.';
    else if (reason.length > 1000) errors['reason'] = 'Keep it to 1,000 characters.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    if (this.rows.some((f) => f.organizationId === organizationId && f.childId === child!.id && f.status === 'Open')) {
      return route.fulfill({
        status: 409,
        contentType: 'application/problem+json',
        json: { code: 'already-flagged' },
      });
    }
    const row: FakeAtRiskFlag = {
      id: `flag-${this.next++}`,
      organizationId,
      childId: child!.id,
      youthName: child!.name,
      raisedById: raiser.id,
      raisedBy: raiser.name,
      severity: b['severity'] as string,
      reason,
      raisedAt: new Date(NOW.getTime() + this.next * 1000).toISOString(),
      status: 'Open',
      outcome: null,
      resolutionNote: null,
      resolvedBy: null,
      resolvedAt: null,
    };
    this.rows.push(row);
    return route.fulfill({ status: 201, json: this.view(row) });
  }

  view(r: FakeAtRiskFlag) {
    return {
      id: r.id,
      childId: r.childId,
      youthName: r.youthName,
      severity: r.severity,
      reason: r.reason,
      raisedBy: r.raisedBy,
      raisedAt: r.raisedAt,
      status: r.status,
      outcome: r.outcome,
      resolutionNote: r.resolutionNote,
      resolvedBy: r.resolvedBy,
      resolvedAt: r.resolvedAt,
    };
  }
}
