import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { SESSION_API } from '../session/session-api.token';
import { ModuleId } from './module-id';
import { ModulesApi } from './modules-api';
import { ModulesLoad } from './modules-load';
import { SaveModulesOutcome } from './save-modules-outcome';

@Injectable()
export class HttpModulesApi implements ModulesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly session = inject(SESSION_API);

  load(): Observable<ModulesLoad> {
    return this.http
      .get<{ modules: { id: ModuleId; on: boolean }[] }>(`${this.baseUrl}/settings/modules`)
      .pipe(
        map((body): ModulesLoad => ({
          status: 'loaded',
          on: body.modules.filter((m) => m.on).map((m) => m.id),
        })),
        catchError((error: HttpErrorResponse) =>
          of<ModulesLoad>({ status: error.status === 403 ? 'forbidden' : 'error' }),
        ),
      );
  }

  save(on: ModuleId[]): Observable<SaveModulesOutcome> {
    return this.http.put<{ on: number }>(`${this.baseUrl}/settings/modules`, { on }).pipe(
      map((body): SaveModulesOutcome => ({ status: 'saved', on: body.on })),
      // The session carries the modules on; reload it so navigation follows the change.
      tap(() => this.session.reset()),
      catchError((error: HttpErrorResponse) =>
        of<SaveModulesOutcome>(
          error.status === 422
            ? { status: 'invalid', errors: error.error?.errors ?? [] }
            : error.status === 403
              ? { status: 'forbidden' }
              : { status: 'error' },
        ),
      ),
    );
  }
}
