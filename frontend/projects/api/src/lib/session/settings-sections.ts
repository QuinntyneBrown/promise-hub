import type { ModuleId } from '../modules/module-id';
import type { SettingsSection } from './settings-section';

/**
 * The tabs of Settings for the session's modules (ADR 0077): Learning Bond appears only while it is on. Shared by the settings library
 * and the learning-bond library's hub, so both render one list.
 */
export function settingsSections(modules: readonly ModuleId[]): SettingsSection[] {
  return [
    { label: 'Organization', link: '/settings/organization' },
    { label: 'Modules', link: '/settings/modules' },
    { label: 'Notifications', link: '/settings/notifications' },
    { label: 'Privacy', link: '/settings/privacy' },
    ...(modules.includes('LearningBond')
      ? [{ label: 'Learning Bond', link: '/settings/learning-bond' }]
      : []),
  ];
}
