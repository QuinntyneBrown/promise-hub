import { InjectionToken } from '@angular/core';
import type { SlipsApi } from './slips-api';

export const SLIPS_API = new InjectionToken<SlipsApi>('SLIPS_API');
