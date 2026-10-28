import { InjectionToken } from '@angular/core';
import type { ScheduleApi } from './schedule-api';

export const SCHEDULE_API = new InjectionToken<ScheduleApi>('SCHEDULE_API');
