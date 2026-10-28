import { InjectionToken } from '@angular/core';
import type { PeopleApi } from './people-api';

export const PEOPLE_API = new InjectionToken<PeopleApi>('PEOPLE_API');
