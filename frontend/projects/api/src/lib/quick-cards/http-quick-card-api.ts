import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { OfflineStore } from '../offline/offline-store';
import { QuickCard } from './quick-card';
import { QuickCardApi } from './quick-card-api';

@Injectable()
export class HttpQuickCardApi implements QuickCardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly store = inject(OfflineStore);

  /** Saves each card on the device; with no signal, answers the saved card marked with when it was saved (L2-028 criterion 1). */
  get(childId: string): Observable<LoadResult<QuickCard>> {
    const key = `quick-card.${childId}`;
    return this.http.get<QuickCard>(`${this.baseUrl}/children/${childId}/quick-card`).pipe(
      tap((card) => this.store.save(key, card)),
      map((value): LoadResult<QuickCard> => ({ status: 'loaded', value })),
      catchError((error: HttpErrorResponse) => {
        const kept = error.status === 0 ? this.store.read<QuickCard>(key) : null;
        return kept
          ? of<LoadResult<QuickCard>>({
              status: 'loaded',
              value: { ...kept.value, savedAt: kept.savedAt },
            })
          : toLoad<QuickCard>(throwError(() => error));
      }),
    );
  }
}
