import { InjectionToken } from '@angular/core';
import type { AttendanceApi } from './attendance-api';

export const ATTENDANCE_API = new InjectionToken<AttendanceApi>('ATTENDANCE_API');
