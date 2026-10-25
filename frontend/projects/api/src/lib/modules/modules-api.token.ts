import { InjectionToken } from '@angular/core';
import type { ModulesApi } from './modules-api';

export const MODULES_API = new InjectionToken<ModulesApi>('MODULES_API');
