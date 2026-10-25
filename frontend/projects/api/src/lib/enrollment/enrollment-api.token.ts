import { InjectionToken } from '@angular/core';
import type { EnrollmentApi } from './enrollment-api';

export const ENROLLMENT_API = new InjectionToken<EnrollmentApi>('ENROLLMENT_API');
