import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { Report } from './report';
import type { ReportExport } from './report-export';

/** Reports and their exports. */
export interface ReportsApi {
  report(programId: string | null): Observable<LoadResult<Report>>;
  export(programId: string | null): Observable<LoadResult<ReportExport>>;
  /** Where the browser downloads an export from. */
  downloadUrl(id: string): string;
}
