// Seeded in-memory data for the fake API. Mirrors backend DatabaseSeeder: two organizations and the Harbourview cast.

export interface Organization {
  id: string;
  name: string;
  plan: 'Free' | 'Standard' | 'Plus';
}

export interface Membership {
  id: string;
  organizationId: string;
  personName: string;
  email: string;
  role: 'Admin' | 'ProgramDirector' | 'SiteLead' | 'YouthWorker' | 'VolunteerCoordinator';
}

export const organizations: Organization[] = [
  { id: 'org-harbourview', name: 'Harbourview Youth Collective', plan: 'Standard' },
  { id: 'org-northgate', name: 'Northgate Community Church Kids', plan: 'Free' },
];

export const memberships: Membership[] = [
  { id: 'm-jaylen', organizationId: 'org-harbourview', personName: 'Jaylen Okafor', email: 'jaylen@harbourview.example', role: 'SiteLead' },
  { id: 'm-marisol', organizationId: 'org-harbourview', personName: 'Marisol Delgado', email: 'marisol@harbourview.example', role: 'ProgramDirector' },
  { id: 'm-tom', organizationId: 'org-harbourview', personName: 'Tom Nguyen', email: 'tom@harbourview.example', role: 'Admin' },
  { id: 'm-priya-hyc', organizationId: 'org-harbourview', personName: 'Priya Raman', email: 'priya@harbourview.example', role: 'VolunteerCoordinator' },
  { id: 'm-aisha', organizationId: 'org-harbourview', personName: 'Aisha Bello', email: 'aisha@harbourview.example', role: 'YouthWorker' },
  { id: 'm-priya-ngk', organizationId: 'org-northgate', personName: 'Priya Raman', email: 'priya@harbourview.example', role: 'VolunteerCoordinator' },
  { id: 'm-grace', organizationId: 'org-northgate', personName: 'Grace Mensah', email: 'grace@northgate.example', role: 'Admin' },
];

export type MembershipId = (typeof memberships)[number]['id'];

/** The password every seeded staff member signs in with in the fake (the real seed reads it from configuration). */
export const seededPassword = 'harbour-tutoring-2026';

/** The six-digit code the fake accepts for staff enrolled in MFA. */
export const seededMfaCode = '246810';
