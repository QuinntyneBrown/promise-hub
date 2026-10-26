import { InjectionToken } from '@angular/core';
import type { ReportsApi } from './reports-api';

export const REPORTS_API = new InjectionToken<ReportsApi>('REPORTS_API');
