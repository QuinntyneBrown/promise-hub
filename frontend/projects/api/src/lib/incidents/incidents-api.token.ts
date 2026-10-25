import { InjectionToken } from '@angular/core';
import type { IncidentsApi } from './incidents-api';

export const INCIDENTS_API = new InjectionToken<IncidentsApi>('INCIDENTS_API');
