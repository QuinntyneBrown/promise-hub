import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { CohortReport } from './cohort-report';
import type { ProgressBoard } from './progress-board';
import type { StaffReport } from './staff-report';
import type { YouthReport } from './youth-report';
import type { Report } from './report';
import type { ReportExport } from './report-export';
import type { SurveySent } from './survey-sent';

/** Reports and their exports. */
export interface ReportsApi {
  report(programId: string | null): Observable<LoadResult<Report>>;
  /** The cohort report of one program (L2-127). */
  cohort(programId: string): Observable<LoadResult<CohortReport>>;
  /** The youth report of one child (L2-127). */
  youth(childId: string): Observable<LoadResult<YouthReport>>;
  /** The staff activity report for the last 30 or 90 days, or all time (L2-128). */
  staff(days: 30 | 90 | null): Observable<LoadResult<StaffReport>>;
  /** The progress board of one cohort (L2-131). */
  progress(programId: string): Observable<LoadResult<ProgressBoard>>;
  export(programId: string | null): Observable<LoadResult<ReportExport>>;
  /** Where the browser downloads an export from. */
  downloadUrl(id: string): string;
  /** Texts the event's households a survey link per child. */
  sendSurvey(eventId: string): Observable<LoadResult<SurveySent>>;
}
