import { InjectionToken } from '@angular/core';
import type { GuardianEnrollmentApi } from './guardian-enrollment-api';

export const GUARDIAN_ENROLLMENT_API = new InjectionToken<GuardianEnrollmentApi>(
  'GUARDIAN_ENROLLMENT_API',
);
