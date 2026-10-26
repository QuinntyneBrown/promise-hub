import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { NewPickup } from './new-pickup';
import { PickupApi } from './pickup-api';
import { PickupRequest } from './pickup-request';

@Injectable()
export class HttpPickupApi implements PickupApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  add(childId: string, pickup: NewPickup): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/children/${childId}/pickups`, pickup),
    );
  }

  remove(childId: string, pickupId: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.delete<null>(`${this.baseUrl}/children/${childId}/pickups/${pickupId}`),
    );
  }

  askGuardian(sessionId: string, childId: string, collectorName: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/sessions/${sessionId}/pickup-requests`, {
        childId,
        collectorName,
      }),
    );
  }

  request(id: string): Observable<LoadResult<PickupRequest>> {
    return toLoad(this.http.get<PickupRequest>(`${this.baseUrl}/pickup-requests/${id}`));
  }
}
