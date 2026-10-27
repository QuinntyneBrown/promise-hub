import { InjectionToken } from '@angular/core';
import type { ApplicationsApi } from './applications-api';

export const APPLICATIONS_API = new InjectionToken<ApplicationsApi>('APPLICATIONS_API');
