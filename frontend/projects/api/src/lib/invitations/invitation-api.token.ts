import { InjectionToken } from '@angular/core';
import type { InvitationApi } from './invitation-api';

export const INVITATION_API = new InjectionToken<InvitationApi>('INVITATION_API');
