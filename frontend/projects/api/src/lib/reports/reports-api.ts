import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Report } from './report';
import type { ReportExport } from './report-export';
import type { SurveySent } from './survey-sent';

/** Reports and their exports. */
export interface ReportsApi {
  report(programId: string | null): Observable<LoadResult<Report>>;
  export(programId: string | null): Observable<LoadResult<ReportExport>>;
  /** Where the browser downloads an export from. */
  downloadUrl(id: string): string;
  /** Texts the event's households a survey link per child. */
  sendSurvey(eventId: string): Observable<LoadResult<SurveySent>>;
}
