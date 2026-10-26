import { InjectionToken } from '@angular/core';
import type { StaffApi } from './staff-api';

export const STAFF_API = new InjectionToken<StaffApi>('STAFF_API');
