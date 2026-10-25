import { InjectionToken } from '@angular/core';
import type { GuardianApi } from './guardian-api';

export const GUARDIAN_API = new InjectionToken<GuardianApi>('GUARDIAN_API');
