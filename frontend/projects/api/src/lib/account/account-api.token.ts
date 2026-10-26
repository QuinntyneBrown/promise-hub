import { InjectionToken } from '@angular/core';
import type { AccountApi } from './account-api';

export const ACCOUNT_API = new InjectionToken<AccountApi>('ACCOUNT_API');
