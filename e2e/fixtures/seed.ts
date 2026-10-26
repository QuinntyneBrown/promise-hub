// Seeded in-memory data for the fake API. Mirrors backend DatabaseSeeder: two organizations and the Harbourview cast.

export type ModuleId =
  | 'Roster' | 'Slips' | 'RollCall' | 'QuickCards' | 'Pickup' | 'Messages' | 'Incidents' | 'Reports'
  | 'Learning' | 'Mentoring' | 'PublicWebsite';

/** Mirrors backend ModuleCatalog: names, order and dependencies. */
export const moduleCatalog: { id: ModuleId; name: string; needs: ModuleId[] }[] = [
  { id: 'Roster', name: 'Roster', needs: [] },
  { id: 'Slips', name: 'Permission slips', needs: ['Roster'] },
  { id: 'RollCall', name: 'Roll Call', needs: ['Roster'] },
  { id: 'QuickCards', name: 'Quick Cards', needs: ['Roster'] },
  { id: 'Pickup', name: 'Pickup', needs: ['Roster', 'RollCall'] },
  { id: 'Messages', name: 'Messages', needs: ['Roster'] },
  { id: 'Incidents', name: 'Incident log', needs: ['Roster'] },
  { id: 'Reports', name: 'Reports', needs: ['Roster'] },
  // From Waypoint (ADR 0043); off until an admin turns them on.
  { id: 'Learning', name: 'Learning', needs: ['Roster'] },
  { id: 'Mentoring', name: 'Mentoring', needs: ['Roster'] },
  { id: 'PublicWebsite', name: 'Public website', needs: ['Roster'] },
];

export interface Organization {
  id: string;
  name: string;
  city?: string;
  slug?: string;
  plan: 'Free' | 'Standard' | 'Plus';
  modules: ModuleId[];
}

export interface Membership {
  id: string;
  organizationId: string;
  personName: string;
  email: string;
  role: 'Admin' | 'ProgramDirector' | 'SiteLead' | 'YouthWorker' | 'VolunteerCoordinator' | 'Youth' | 'Mentor' | 'Volunteer';
}

export const organizations: Organization[] = [
  {
    id: 'org-harbourview',
    name: 'Harbourview Youth Collective',
    city: 'Hamilton, Ontario',
    slug: 'harbourview',
    plan: 'Standard',
    // The whole suite plus Learning and Mentoring from Waypoint; Public website stays off (ADR 0043).
    modules: ['Roster', 'Slips', 'RollCall', 'QuickCards', 'Pickup', 'Messages', 'Incidents', 'Reports', 'Learning', 'Mentoring'],
  },
  { id: 'org-northgate', name: 'Northgate Community Church Kids', city: 'Burlington, Ontario', slug: 'northgate', plan: 'Free', modules: ['Roster', 'RollCall', 'QuickCards'] },
];

export const memberships: Membership[] = [
  { id: 'm-jaylen', organizationId: 'org-harbourview', personName: 'Jaylen Okafor', email: 'jaylen@harbourview.example', role: 'SiteLead' },
  { id: 'm-marisol', organizationId: 'org-harbourview', personName: 'Marisol Delgado', email: 'marisol@harbourview.example', role: 'ProgramDirector' },
  { id: 'm-tom', organizationId: 'org-harbourview', personName: 'Tom Nguyen', email: 'tom@harbourview.example', role: 'Admin' },
  { id: 'm-priya-hyc', organizationId: 'org-harbourview', personName: 'Priya Raman', email: 'priya@harbourview.example', role: 'VolunteerCoordinator' },
  { id: 'm-aisha', organizationId: 'org-harbourview', personName: 'Aisha Bello', email: 'aisha@harbourview.example', role: 'YouthWorker' },
  { id: 'm-priya-ngk', organizationId: 'org-northgate', personName: 'Priya Raman', email: 'priya@harbourview.example', role: 'VolunteerCoordinator' },
  { id: 'm-grace', organizationId: 'org-northgate', personName: 'Grace Mensah', email: 'grace@northgate.example', role: 'Admin' },
  // From Waypoint (ADR 0043): youth, mentors and a volunteer.
  { id: 'm-sofia', organizationId: 'org-harbourview', personName: 'Sofía Rivera', email: 'sofia@harbourview.example', role: 'Youth' },
  { id: 'm-nadia', organizationId: 'org-harbourview', personName: 'Nadia Haddad', email: 'nadia@harbourview.example', role: 'Youth' },
  { id: 'm-daniel', organizationId: 'org-harbourview', personName: 'Daniel Osei', email: 'daniel@harbourview.example', role: 'Mentor' },
  { id: 'm-hana', organizationId: 'org-harbourview', personName: 'Hana Kim', email: 'hana@harbourview.example', role: 'Mentor' },
  { id: 'm-leo', organizationId: 'org-harbourview', personName: 'Leo Martins', email: 'leo@harbourview.example', role: 'Volunteer' },
  { id: 'm-samuel', organizationId: 'org-northgate', personName: 'Samuel Boateng', email: 'samuel@northgate.example', role: 'Mentor' },
  { id: 'm-lucia', organizationId: 'org-northgate', personName: 'Lucía Rivera', email: 'lucia@northgate.example', role: 'Youth' },
];

export type MembershipId = (typeof memberships)[number]['id'];

/** The password every seeded staff member signs in with in the fake (the real seed reads it from configuration). */
export const seededPassword = 'harbour-tutoring-2026';

/** The six-digit code the fake accepts for staff enrolled in MFA. */
export const seededMfaCode = '246810';
