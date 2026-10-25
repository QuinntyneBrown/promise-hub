import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { WriteOutcome } from '../write-outcome';
import type { Incident } from './incident';
import type { IncidentForm } from './incident-form';
import type { IncidentReport } from './incident-report';
import type { IncidentSummary } from './incident-summary';

/** The incident log: supervisors read all of it, everyone else their own reports. */
export interface IncidentsApi {
  list(): Observable<LoadResult<{ canReadLog: boolean; incidents: IncidentSummary[] }>>;
  get(id: string): Observable<LoadResult<Incident>>;
  form(): Observable<LoadResult<IncidentForm>>;
  report(report: IncidentReport): Observable<WriteOutcome>;
}
