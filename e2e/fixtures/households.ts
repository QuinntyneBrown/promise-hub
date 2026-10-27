// Seeded households for the fake API. Mirrors backend DatabaseSeeder; "today" is 5 November 2026.

export interface FakeGuardian {
  id: string;
  name: string;
  relationship: string;
  mobile: string | null;
  email: string | null;
  language: string;
  isPrimary: boolean;
  canPickUp: boolean;
  canSign: boolean;
  emailBounced?: boolean;
}

export interface FakeMedical {
  allergies: string | null;
  medication: string | null;
  conditions: string | null;
  doctor: string | null;
  redAlert: boolean;
  alertInstruction?: string | null;
  healthCard?: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface FakeChild {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  school: string | null;
  medical: FakeMedical;
  notes?: string | null;
}

export interface FakeHousehold {
  id: string;
  organizationId: string;
  name: string;
  language: string;
  guardians: FakeGuardian[];
  children: FakeChild[];
}

const noMedical: FakeMedical = {
  allergies: null,
  medication: null,
  conditions: null,
  doctor: null,
  redAlert: false,
  updatedAt: null,
  updatedBy: null,
};

const guardian = (
  id: string,
  name: string,
  relationship: string,
  mobile: string | null,
  email: string | null,
  language: string,
  isPrimary = false,
): FakeGuardian => ({
  id,
  name,
  relationship,
  mobile,
  email,
  language,
  isPrimary,
  canPickUp: true,
  canSign: isPrimary,
});

export function seedHouseholds(): FakeHousehold[] {
  return [
    {
      id: "hh-rivera",
      organizationId: "org-harbourview",
      name: "Rivera",
      language: "Spanish",
      guardians: [
        guardian(
          "g-carmen",
          "Carmen Rivera",
          "Mother",
          "905-555-0142",
          "carmen.rivera@example.com",
          "Spanish",
          true,
        ),
        guardian(
          "g-luis",
          "Luis Rivera",
          "Uncle or aunt",
          "905-555-0199",
          null,
          "Spanish",
        ),
      ],
      children: [
        {
          id: "c-mateo",
          firstName: "Mateo",
          lastName: "Rivera",
          dateOfBirth: "2017-03-14",
          school: "Bennetto Elementary, Grade 4",
          medical: {
            allergies: "Peanuts (anaphylaxis); tree nuts (hives)",
            medication: "EpiPen 0.3 mg, carried",
            conditions: null,
            doctor: "Dr. Amrita Sethi · 905-555-0100",
            redAlert: true,
            alertInstruction:
              "EpiPen in backpack front pocket. Use it, call 911, then Carmen.",
            healthCard: "Ontario ···· 4471",
            updatedAt: "2026-09-02T19:55:00Z",
            updatedBy: "Carmen Rivera",
          },
          notes: "Sits with Jordan.",
        },
        {
          id: "c-sofia",
          firstName: "Sofía",
          lastName: "Rivera",
          dateOfBirth: "2014-06-02",
          school: "Bennetto Elementary, Grade 7",
          medical: {
            ...noMedical,
            medication: "Inhaler as needed",
            conditions: "Asthma",
            updatedAt: "2026-09-02T19:55:00Z",
            updatedBy: "Carmen Rivera",
          },
        },
      ],
    },
    {
      id: "hh-thompson",
      organizationId: "org-harbourview",
      name: "Thompson",
      language: "English",
      guardians: [
        guardian(
          "g-dana",
          "Dana Thompson",
          "Mother",
          "905-555-0117",
          "dana.thompson@example.com",
          "English",
          true,
        ),
      ],
      children: [
        {
          id: "c-jordan",
          firstName: "Jordan",
          lastName: "Thompson",
          dateOfBirth: "2015-02-20",
          school: "Hess Street School, Grade 6",
          medical: noMedical,
        },
      ],
    },
    {
      id: "hh-tran",
      organizationId: "org-harbourview",
      name: "Tran",
      language: "English",
      guardians: [
        guardian(
          "g-linh",
          "Linh Tran",
          "Mother",
          "905-555-0163",
          null,
          "English",
          true,
        ),
      ],
      children: [
        {
          id: "c-kevin",
          firstName: "Kevin",
          lastName: "Tran",
          dateOfBirth: "2018-05-09",
          school: "Queen Victoria School, Grade 3",
          medical: noMedical,
        },
        {
          id: "c-emily",
          firstName: "Emily",
          lastName: "Tran",
          dateOfBirth: "2016-08-30",
          school: "Queen Victoria School, Grade 5",
          medical: noMedical,
        },
      ],
    },
    {
      id: "hh-haddad",
      organizationId: "org-harbourview",
      name: "Haddad",
      language: "French",
      guardians: [
        guardian(
          "g-nour",
          "Nour Haddad",
          "Mother",
          "905-555-0128",
          "nour.haddad@example.com",
          "French",
          true,
        ),
      ],
      children: [
        {
          id: "c-yusuf",
          firstName: "Yusuf",
          lastName: "Haddad",
          dateOfBirth: "2013-09-04",
          school: "École Pavillon de la jeunesse, Grade 8",
          medical: { ...noMedical, medication: "Methylphenidate at lunch" },
        },
        // Yusuf's older sister signs in to Learning with a youth account (ADR 0043); she is enrolled in no program.
        {
          id: "c-nadia",
          firstName: "Nadia",
          lastName: "Haddad",
          dateOfBirth: "2008-03-15",
          school: "Sir John A. Macdonald Secondary, Grade 12",
          medical: noMedical,
        },
      ],
    },
    {
      id: "hh-okonkwo",
      organizationId: "org-harbourview",
      name: "Okonkwo",
      language: "English",
      guardians: [
        {
          ...guardian(
            "g-chidi",
            "Chidi Okonkwo",
            "Father",
            null,
            "chidi.okonkwo@example.com",
            "English",
            true,
          ),
          emailBounced: true,
        },
      ],
      children: [
        {
          id: "c-amara",
          firstName: "Amara",
          lastName: "Okonkwo",
          dateOfBirth: "2019-04-11",
          school: "Bennetto Elementary, Grade 2",
          medical: noMedical,
        },
      ],
    },
    {
      id: "hh-northgate-rivera",
      organizationId: "org-northgate",
      name: "Rivera",
      language: "Spanish",
      guardians: [
        guardian(
          "g-ana",
          "Ana Rivera",
          "Mother",
          "289-555-0101",
          null,
          "Spanish",
          true,
        ),
      ],
      children: [
        {
          id: "c-ng-mateo",
          firstName: "Mateo",
          lastName: "Rivera",
          dateOfBirth: "2016-10-01",
          school: null,
          medical: noMedical,
        },
        {
          id: "c-ng-lucia",
          firstName: "Lucía",
          lastName: "Rivera",
          dateOfBirth: "2012-05-20",
          school: null,
          medical: noMedical,
        },
      ],
    },
  ];
}

const today = new Date("2026-11-05T12:00:00Z");

export function ageOf(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const born = new Date(`${dateOfBirth}T12:00:00Z`);
  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const birthday = new Date(
    Date.UTC(today.getUTCFullYear(), born.getUTCMonth(), born.getUTCDate()),
  );
  if (birthday > today) age--;
  return age;
}

export const reachable = (g: FakeGuardian) =>
  !!g.mobile || (!!g.email && !g.emailBounced);

export const hasMedicalFlag = (c: FakeChild) =>
  !!(c.medical.allergies || c.medical.medication || c.medical.conditions);

export const medicalFlag = (c: FakeChild) =>
  c.medical.allergies
    ? "Allergy"
    : c.medical.medication
      ? "Medication"
      : (c.medical.conditions ?? null);
