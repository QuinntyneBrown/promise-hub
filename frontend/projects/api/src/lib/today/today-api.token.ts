import { InjectionToken } from '@angular/core';
import type { TodayApi } from './today-api';

export const TODAY_API = new InjectionToken<TodayApi>('TODAY_API');
