import type { Observable } from 'rxjs';
import type { LoadResult } from '../load-result';
import type { AuditFilter } from './audit-filter';
import type { AuditLog } from './audit-log';

/** The organization's audit log, for admins. */
export interface AuditApi {
  search(filter: AuditFilter): Observable<LoadResult<AuditLog>>;
  /** Where the browser downloads the filtered log as CSV; downloading is logged. */
  exportUrl(filter: AuditFilter): string;
}
