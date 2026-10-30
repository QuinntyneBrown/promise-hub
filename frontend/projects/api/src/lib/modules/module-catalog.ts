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
  // Learning, Mentoring and Public website (ADR 0043): switched on one at a time, never by the whole-suite preset.
  {
    id: 'Learning',
    name: 'Learning',
    description: 'Lessons, quizzes, assignments and badges for youth.',
    needs: ['Roster'],
  },
  {
    id: 'Mentoring',
    name: 'Mentoring',
    description: 'Mentors, assigned youth, check-ins and at-risk flags.',
    needs: ['Roster'],
  },
  {
    id: 'PublicWebsite',
    name: 'Public website',
    description: 'Your organization’s public pages.',
    needs: ['Roster'],
  },
  // Learning Bond (ADR 0076): needs Roster and Messages, and the data-handling agreement accepted before it turns on; no preset turns it on.
  {
    id: 'LearningBond',
    name: 'Learning Bond',
    description:
      'Claims every dollar the government already owes your child, from birth to university.',
    needs: ['Roster', 'Messages'],
  },
];

/** The eight operations modules of the "Whole suite" preset. */
const SUITE: ModuleId[] = [
  'Roster',
  'Slips',
  'RollCall',
  'QuickCards',
  'Pickup',
  'Messages',
  'Incidents',
  'Reports',
];

/** The presets offered in Settings › Modules and onboarding (L2-004). */
export const MODULE_PRESETS: { name: string; modules: ModuleId[] | null }[] = [
  { name: 'Whole suite', modules: SUITE },
  { name: 'Just check-in', modules: ['Roster', 'RollCall', 'QuickCards'] },
  { name: 'Just slips', modules: ['Roster', 'Slips'] },
  { name: 'Custom', modules: null },
];
