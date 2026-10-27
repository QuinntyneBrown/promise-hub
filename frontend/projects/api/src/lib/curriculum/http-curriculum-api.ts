import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api-base-url';
import { toLoad, toWrite } from '../http-results';
import { LoadResult } from '../load-result';
import { WriteOutcome } from '../write-outcome';
import { CurriculumApi } from './curriculum-api';
import { Curriculum } from './curriculum';
import { ModuleDetail } from './module-detail';
import { ModuleFields } from './module-fields';
import { NewTrack } from './new-track';

@Injectable()
export class HttpCurriculumApi implements CurriculumApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  tracks(): Observable<LoadResult<Curriculum>> {
    return toLoad(this.http.get<Curriculum>(`${this.baseUrl}/curriculum`));
  }

  createTrack(track: NewTrack): Observable<WriteOutcome> {
    return toWrite(this.http.post<{ id: string }>(`${this.baseUrl}/curriculum/tracks`, track));
  }

  reorderModules(trackId: string, moduleIds: string[]): Observable<WriteOutcome> {
    return toWrite(
      this.http.put<null>(`${this.baseUrl}/curriculum/tracks/${trackId}/module-order`, {
        moduleIds,
      }),
    );
  }

  createModule(trackId: string, title: string, description: string): Observable<WriteOutcome> {
    return toWrite(
      this.http.post<{ id: string }>(`${this.baseUrl}/curriculum/modules`, {
        trackId,
        title,
        description,
      }),
    );
  }

  module(id: string): Observable<LoadResult<ModuleDetail>> {
    return toLoad(this.http.get<ModuleDetail>(`${this.baseUrl}/curriculum/modules/${id}`));
  }

  updateModule(id: string, fields: ModuleFields): Observable<WriteOutcome> {
    return toWrite(this.http.put<null>(`${this.baseUrl}/curriculum/modules/${id}`, fields));
  }
}
