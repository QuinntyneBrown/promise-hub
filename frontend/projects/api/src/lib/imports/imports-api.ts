import type { Observable } from 'rxjs';
import type { ImportPreview } from './import-preview';
import type { ImportSummary } from './import-summary';
import type { ImportUpload } from './import-upload';

export type ImportStep<T> =
  | { status: 'ok'; value: T }
  | { status: 'invalid'; errors: Record<string, string> }
  | { status: 'error' };

/** Roster import: upload a spreadsheet, map its columns, run it. */
export interface ImportsApi {
  upload(file: File): Observable<ImportStep<ImportUpload>>;
  saveMapping(
    id: string,
    mapping: Record<string, string>,
    programId: string | null,
  ): Observable<ImportStep<ImportPreview>>;
  run(id: string, merge: number[]): Observable<ImportStep<ImportSummary>>;
}
