import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { ImportPreview } from './import-preview';
import { ImportSummary } from './import-summary';
import { ImportUpload } from './import-upload';
import { ImportStep, ImportsApi } from './imports-api';

function step<T>(call: Observable<T>): Observable<ImportStep<T>> {
  return call.pipe(
    map((value): ImportStep<T> => ({ status: 'ok', value })),
    catchError((error: HttpErrorResponse) =>
      of<ImportStep<T>>(
        error.status === 422
          ? { status: 'invalid', errors: error.error?.errors ?? {} }
          : { status: 'error' },
      ),
    ),
  );
}

@Injectable()
export class HttpImportsApi implements ImportsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  upload(file: File): Observable<ImportStep<ImportUpload>> {
    const form = new FormData();
    form.append('file', file, file.name);
    return step(this.http.post<ImportUpload>(`${this.baseUrl}/imports`, form));
  }

  saveMapping(
    id: string,
    mapping: Record<string, string>,
    programId: string | null,
  ): Observable<ImportStep<ImportPreview>> {
    return step(
      this.http.put<ImportPreview>(`${this.baseUrl}/imports/${id}/mapping`, { mapping, programId }),
    );
  }

  run(id: string, merge: number[]): Observable<ImportStep<ImportSummary>> {
    return step(this.http.post<ImportSummary>(`${this.baseUrl}/imports/${id}/run`, { merge }));
  }
}
