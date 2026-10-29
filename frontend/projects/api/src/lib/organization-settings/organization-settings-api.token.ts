import { InjectionToken } from '@angular/core';
import type { OrganizationSettingsApi } from './organization-settings-api';

export const ORGANIZATION_SETTINGS_API = new InjectionToken<OrganizationSettingsApi>(
  'ORGANIZATION_SETTINGS_API',
);
