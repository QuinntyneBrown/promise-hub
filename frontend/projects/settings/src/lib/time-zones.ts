import type { SelectOption } from '@promisehub/components';

/** The time zones an organization may choose, with their names in Settings (mirrors backend OrganizationTimeZones). */
export const TIME_ZONES: SelectOption[] = [
  { value: 'America/St_Johns', label: 'Newfoundland (St. John’s)' },
  { value: 'America/Halifax', label: 'Atlantic (Halifax)' },
  { value: 'America/Toronto', label: 'Eastern (Toronto)' },
  { value: 'America/Winnipeg', label: 'Central (Winnipeg)' },
  { value: 'America/Regina', label: 'Saskatchewan (Regina)' },
  { value: 'America/Edmonton', label: 'Mountain (Edmonton)' },
  { value: 'America/Vancouver', label: 'Pacific (Vancouver)' },
  { value: 'America/Whitehorse', label: 'Yukon (Whitehorse)' },
];

/** The name of a time zone in Settings, or the zone itself. */
export function timeZoneLabel(zone: string): string {
  return TIME_ZONES.find((z) => z.value === zone)?.label ?? zone;
}
