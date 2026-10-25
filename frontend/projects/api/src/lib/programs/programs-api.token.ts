import { InjectionToken } from '@angular/core';
import type { ProgramsApi } from './programs-api';

export const PROGRAMS_API = new InjectionToken<ProgramsApi>('PROGRAMS_API');
