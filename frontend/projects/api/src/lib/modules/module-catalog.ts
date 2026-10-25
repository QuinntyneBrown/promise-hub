import type { ModuleId } from './module-id';

/** Every module with its name, a one-line description and what it needs. The server enforces the same rules. */
export const MODULE_CATALOG: {
  id: ModuleId;
  name: string;
  description: string;
  needs: ModuleId[];
}[] = [
  {
    id: 'Roster',
    name: 'Roster',
    description: 'Families, children, guardians, enrollment.',
    needs: [],
  },
  {
    id: 'Slips',
    name: 'Permission slips',
    description: 'Signed slips, reminders, day-of status.',
    needs: ['Roster'],
  },
  {
    id: 'RollCall',
    name: 'Roll Call',
    description: 'Check-in, sign-out, attendance, offline.',
    needs: ['Roster'],
  },
  {
    id: 'QuickCards',
    name: 'Quick Cards',
    description: 'Allergies, medication, contacts; offline.',
    needs: ['Roster'],
  },
  {
    id: 'Pickup',
    name: 'Pickup',
    description: 'Approved adults, ID checks.',
    needs: ['Roster', 'RollCall'],
  },
  {
    id: 'Messages',
    name: 'Messages',
    description: 'Texts, emails, push; no-show alerts.',
    needs: ['Roster'],
  },
  {
    id: 'Incidents',
    name: 'Incident log',
    description: 'Reports, review, audit trail.',
    needs: ['Roster'],
  },
  {
    id: 'Reports',
    name: 'Reports',
    description: 'Grant-ready attendance and outcomes.',
    needs: ['Roster'],
  },
];

/** The presets offered in Settings › Modules and onboarding (L2-004). */
export const MODULE_PRESETS: { name: string; modules: ModuleId[] | null }[] = [
  { name: 'Whole suite', modules: MODULE_CATALOG.map((m) => m.id) },
  { name: 'Just check-in', modules: ['Roster', 'RollCall', 'QuickCards'] },
  { name: 'Just slips', modules: ['Roster', 'Slips'] },
  { name: 'Custom', modules: null },
];
