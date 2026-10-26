import { InjectionToken } from '@angular/core';
import type { AuditApi } from './audit-api';

export const AUDIT_API = new InjectionToken<AuditApi>('AUDIT_API');
