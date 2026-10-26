import { InjectionToken } from '@angular/core';
import type { PrivacyApi } from './privacy-api';

export const PRIVACY_API = new InjectionToken<PrivacyApi>('PRIVACY_API');
