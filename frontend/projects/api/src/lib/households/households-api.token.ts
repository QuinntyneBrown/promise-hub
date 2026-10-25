import { InjectionToken } from '@angular/core';
import type { HouseholdsApi } from './households-api';

export const HOUSEHOLDS_API = new InjectionToken<HouseholdsApi>('HOUSEHOLDS_API');
