import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad } from '../http-results';
import { LoadResult } from '../load-result';
import { Billing } from './billing';
import { BillingApi } from './billing-api';
import { PlanChange } from './plan-change';

@Injectable()
export class HttpBillingApi implements BillingApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  load(): Observable<LoadResult<Billing>> {
    return toLoad(this.http.get<Billing>(`${this.baseUrl}/billing`));
  }

  changePlan(plan: Billing['plan']): Observable<PlanChange> {
    return this.http
      .put<{ plan: string; proratedCharge: number }>(`${this.baseUrl}/billing/plan`, { plan })
      .pipe(
        map((r): PlanChange => ({
          status: 'changed',
          plan: r.plan,
          proratedCharge: r.proratedCharge,
        })),
        catchError((e: HttpErrorResponse) =>
          of<PlanChange>(
            e.status === 422
              ? {
                  status: 'invalid',
                  message: e.error?.errors?.plan ?? 'That plan can’t be chosen.',
                }
              : { status: 'error' },
          ),
        ),
      );
  }
}
