import { InjectionToken } from '@angular/core';
import type { SetupApi } from './setup-api';

export const SETUP_API = new InjectionToken<SetupApi>('SETUP_API');
