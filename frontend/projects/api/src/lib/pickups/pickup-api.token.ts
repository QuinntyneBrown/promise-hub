import { InjectionToken } from '@angular/core';
import type { PickupApi } from './pickup-api';

export const PICKUP_API = new InjectionToken<PickupApi>('PICKUP_API');
