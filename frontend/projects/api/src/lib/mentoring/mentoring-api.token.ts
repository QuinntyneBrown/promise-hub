import { InjectionToken } from '@angular/core';
import type { MentoringApi } from './mentoring-api';

export const MENTORING_API = new InjectionToken<MentoringApi>('MENTORING_API');
