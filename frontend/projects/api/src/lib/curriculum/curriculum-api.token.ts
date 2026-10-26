import { InjectionToken } from '@angular/core';
import type { CurriculumApi } from './curriculum-api';

export const CURRICULUM_API = new InjectionToken<CurriculumApi>('CURRICULUM_API');
