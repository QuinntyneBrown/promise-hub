import { InjectionToken } from '@angular/core';
import type { BillingApi } from './billing-api';

export const BILLING_API = new InjectionToken<BillingApi>('BILLING_API');
