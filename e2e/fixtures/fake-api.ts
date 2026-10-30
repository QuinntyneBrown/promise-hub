import type { Page, Route } from "@playwright/test";
import {
  type FakeChild,
  type FakeGuardian,
  type FakeHousehold,
  ageOf,
  hasMedicalFlag,
  medicalFlag,
  reachable,
  seedHouseholds,
} from "./households";
import { FakeBadges } from "./fake-badges";
import { FakeLearningBond, type FakeLearningBondProgram } from "./fake-learning-bond";
import { FakeCurriculum } from "./fake-curriculum";
import { FakeProgression } from "./fake-progression";
import { FakeJourney } from "./fake-journey";
import { FakeReflections } from "./fake-reflections";
import { FakeLearning } from "./fake-learning";
import { FakeReviews, type YouthAccounts } from "./fake-reviews";
import {
  FakeMentorCheckIns,
  type FakeMentorCheckIn,
  TODAY,
} from "./fake-mentor-check-ins";
import {
  FakeConversations,
  type FakeDirectMessage,
} from "./fake-conversations";
import {
  FakeAnnouncements,
  reachesGuardians,
  reachesMentors,
  reachesYouth,
  type FakeAnnouncement,
} from "./fake-announcements";
import { FakeAtRiskFlags } from "./fake-at-risk-flags";
import { FakeReports, type ReportSource } from "./fake-reports";
import {
  FakeWebsite,
  FakeWebsiteRequests,
  type FakeWebsiteRequest,
  type WebsiteRequestKind,
  type WebsiteSource,
} from "./fake-website";
import { FakeAssignedWorkStore, type Recipient } from "./fake-assigned-work";
import {
  type FakeEvent,
  type FakeProgram,
  NOW,
  seedEvents,
  seedPrograms,
  weeklyStarts,
  hamiltonDay,
} from "./programs";
import {
  type Membership,
  type ModuleId,
  moduleCatalog,
  memberships,
  organizations,
  seededMfaCode,
  seededPassword,
} from "./seed";

/** Mirrors backend RolePermissions. */
/** A person's display preferences (L2-119, L2-120). Mirrors backend DisplayPreferencesDto. */
interface FakeDisplay {
  theme: "system" | "light" | "dark";
  textSize: "default" | "large" | "larger";
  reduceMotion: boolean;
}

/** A youth's answer for a session (L2-094). */
interface FakeRsvp {
  eventId: string;
  childId: string;
  response: "Going" | "Maybe" | "CantMake";
  note: string | null;
  answeredAt: string;
}

/** The modules each notification kind needs, all of them on (L2-109). Mirrors backend NotificationKinds. */
const NOTIFICATION_MODULES: Record<string, ModuleId[]> = {
  learning: ["Learning"],
  assignments: ["Learning", "Mentoring"],
  messages: ["Messages", "Mentoring"],
  announcements: ["Messages"],
  incidents: ["Incidents"],
  mentoring: ["Mentoring"],
  requests: ["Roster"],
  staff: ["Roster"],
};

/** The kinds a member may choose, in order, with who receives each (L2-111). Mirrors backend NotificationKinds. */
const NOTIFICATION_KINDS: {
  key: string;
  name: string;
  hint: string;
  receives: (m: Membership) => boolean;
}[] = [
  {
    key: "learning",
    name: "Grades and badges",
    hint: "When your work is graded, a quiz score is approved or you earn a badge.",
    receives: (m) => m.role === "Youth",
  },
  {
    key: "assignments",
    name: "Assigned work",
    hint: "When your mentor assigns you a lesson, quiz or assignment.",
    receives: (m) => m.role === "Youth",
  },
  {
    key: "messages",
    name: "Messages",
    hint: "When someone writes to you in a conversation.",
    receives: (m) => m.role === "Youth" || m.role === "Mentor",
  },
  {
    key: "announcements",
    name: "Announcements",
    hint: "When an announcement for your programs is posted.",
    receives: (m) => m.role === "Youth" || m.role === "Mentor",
  },
  {
    key: "incidents",
    name: "Incidents to review",
    hint: "When an incident is reported.",
    receives: (m) => m.role === "Admin" || m.role === "ProgramDirector",
  },
  {
    key: "mentoring",
    name: "At-risk flags",
    hint: "When a mentor flags a youth as at risk.",
    receives: (m) => m.role === "Admin" || m.role === "ProgramDirector",
  },
  {
    key: "requests",
    name: "Family data requests",
    hint: "When a household asks for a copy or deletion of its data.",
    receives: (m) => m.role === "Admin" || m.role === "ProgramDirector",
  },
  {
    key: "staff",
    name: "Staff invitations",
    hint: "When someone asks for a new invitation link.",
    receives: (m) => m.role === "Admin",
  },
  {
    key: "agreement",
    name: "Learning Bond agreement",
    hint: "When a named signer accepts the Learning Bond data-handling agreement.",
    receives: (m) => m.role === "Admin" || m.role === "ProgramDirector",
  },
];

const can = {
  manageSettings: (m: Membership) =>
    ["Admin", "ProgramDirector"].includes(m.role),
  writeHouseholds: (m: Membership) =>
    ["Admin", "ProgramDirector"].includes(m.role),
  deleteHouseholds: (m: Membership) => m.role === "Admin",
  readMedical: (m: Membership) =>
    ["Admin", "ProgramDirector", "SiteLead"].includes(m.role),
  readDateOfBirth: (m: Membership) =>
    ["Admin", "ProgramDirector", "SiteLead"].includes(m.role),
  writeMedical: (m: Membership) =>
    ["Admin", "ProgramDirector"].includes(m.role),
  managePrograms: (m: Membership) =>
    ["Admin", "ProgramDirector"].includes(m.role),
  manageEvents: (m: Membership) =>
    ["Admin", "ProgramDirector", "SiteLead"].includes(m.role),
  cancelEvents: (m: Membership) =>
    ["Admin", "ProgramDirector"].includes(m.role),
  runSessions: (m: Membership) =>
    [
      "Admin",
      "ProgramDirector",
      "SiteLead",
      "YouthWorker",
      "Volunteer",
      "Mentor",
    ].includes(m.role),
  runAnySession: (m: Membership) =>
    ["Admin", "ProgramDirector", "SiteLead"].includes(m.role),
  sendMessages: (m: Membership) =>
    ["Admin", "ProgramDirector", "SiteLead"].includes(m.role),
  manageSlips: (m: Membership) =>
    ["Admin", "ProgramDirector", "SiteLead"].includes(m.role),
  managePickups: (m: Membership) =>
    ["Admin", "ProgramDirector", "SiteLead"].includes(m.role),
  reviewIncidents: (m: Membership) =>
    ["Admin", "ProgramDirector"].includes(m.role),
  reviewEnrollments: (m: Membership) =>
    ["Admin", "ProgramDirector"].includes(m.role),
  viewReports: (m: Membership) =>
    ["Admin", "ProgramDirector", "SiteLead"].includes(m.role),
  readSmallCounts: (m: Membership) =>
    ["Admin", "ProgramDirector"].includes(m.role),
  useStaffApp: (m: Membership) =>
    [
      "Admin",
      "ProgramDirector",
      "SiteLead",
      "YouthWorker",
      "VolunteerCoordinator",
    ].includes(m.role),
  learn: (m: Membership) => m.role === "Youth",
  respondToSessions: (m: Membership) => m.role === "Youth",
  mentorYouth: (m: Membership) => m.role === "Mentor",
  reviewAtRiskFlags: (m: Membership) =>
    ["Admin", "ProgramDirector"].includes(m.role),
  authorCurriculum: (m: Membership) =>
    ["Admin", "ProgramDirector"].includes(m.role),
  reviewAttendance: (m: Membership) =>
    ["Admin", "ProgramDirector", "SiteLead", "Mentor"].includes(m.role),
  correctAttendance: (m: Membership) =>
    ["Admin", "ProgramDirector"].includes(m.role),
  qualifyAttendance: (m: Membership) =>
    ["Admin", "ProgramDirector", "SiteLead", "YouthWorker", "Mentor"].includes(
      m.role,
    ),
};

/**
 * What a participant role (Youth, Mentor, Volunteer) may call: mirrors the API's fallback policy, which closes every staff
 * endpoint to them unless it opts in (ADR 0043). Volunteers also open their assigned sessions.
 */
const PARTICIPANT_PATHS = [
  /^\/api\/me(\/|$)/,
  /^\/api\/announcements\/mine(\/|$)/,
  /^\/api\/conversations(\/|$)/,
  /^\/api\/realtime$/,
  /^\/api\/notifications(\/|$)/,
  /^\/api\/auth\//,
  /^\/api\/learning\//,
  /^\/api\/mentoring\//,
  /^\/api\/curriculum(\/|$)/,
  /^\/api\/schedule(\/|$)/,
];
/** Volunteers and mentors run sessions without the staff app (ADR 0043, ADR 0065): the session endpoints that need RunSessions. */
const RUNNER_PATHS = [
  /^\/api\/attendance$/,
  /^\/api\/sessions\/(today|mine)$/,
  /^\/api\/sessions\/[^/]+\/(roster|check-ins|absences|end|notes|walk-ins)$/,
];

type ImportField =
  | "ChildName"
  | "DateOfBirth"
  | "School"
  | "GuardianName"
  | "GuardianPhone"
  | "GuardianEmail"
  | "Allergies"
  | "Language"
  | "Notes"
  | "Skip"
  | "Cohort"
  | "YouthEmail";

interface FakeImport {
  id: string;
  organizationId: string;
  fileName: string;
  headers: string[];
  rows: string[][];
  mapping: Record<string, ImportField> | null;
  programId: string | null;
  done: boolean;
}

const IMPORT_SYNONYMS: [ImportField, string[]][] = [
  [
    "ChildName",
    [
      "child",
      "child name",
      "student",
      "student name",
      "kid",
      "name",
      "participant",
    ],
  ],
  [
    "DateOfBirth",
    ["dob", "date of birth", "birthday", "birth date", "birthdate"],
  ],
  ["School", ["school", "grade", "school and grade"]],
  [
    "GuardianName",
    [
      "parent",
      "guardian",
      "parent name",
      "guardian name",
      "parent/guardian",
      "mother",
      "father",
      "contact name",
    ],
  ],
  [
    "GuardianPhone",
    [
      "cell",
      "phone",
      "mobile",
      "parent phone",
      "guardian phone",
      "cell phone",
      "phone number",
    ],
  ],
  ["GuardianEmail", ["email", "e-mail", "parent email", "guardian email"]],
  [
    "Allergies",
    [
      "allergies",
      "allergy",
      "medical",
      "allergies/meds",
      "allergies and medication",
    ],
  ],
  ["Language", ["lang", "language", "home language"]],
  ["Notes", ["notes", "note", "comments"]],
  ["Cohort", ["cohort", "group", "program", "class"]],
  ["YouthEmail", ["youth email", "student email", "teen email"]],
];

interface FakeEnrollChild {
  id: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  school: string | null;
  allergies: string | null;
  medication: string | null;
  enroll: boolean;
}

interface FakeEnrollDraft {
  household: {
    guardianName: string | null;
    mobile: string | null;
    email: string | null;
    language: string | null;
  };
  children: FakeEnrollChild[];
  /** Guardian (or missing), Youth or Referrer (L2-071). */
  applyingAs?: string | null;
  referrer?: {
    name: string | null;
    role: string | null;
    organization: string | null;
  } | null;
  reason?: string | null;
}

interface FakeSlip {
  id: string;
  eventId: string;
  title: string;
  body: string;
  signBy: string;
  askPhotos: boolean;
  askSwimming: boolean;
  askLunch: boolean;
  reminders: "TwiceWeekly" | "Daily" | "Once" | "None";
  channel: "TextAndEmail" | "EmailOnly";
  status: "Draft" | "Scheduled" | "Sent";
  scheduledFor: string | null;
  sentAt: string | null;
  version: number;
  answers: Map<
    string,
    { status: "Signed" | "Declined"; by: string; version: number }
  >;
  messageId: string | null;
}

type ChannelChoice = "TextWithEmailFallback" | "EmailOnly" | "TextOnly";

interface FakeDelivery {
  household: string;
  /** The household's id, for its guardian announcements (L2-103). */
  householdId?: string;
  /** When the household marked it read on the guardian pages. */
  readAt?: string | null;
  guardian: string | null;
  channel: "Sms" | "Email";
  language: string;
  status: "Queued" | "Sent" | "FellBackToEmail" | "Paused" | "Failed";
  reason: string | null;
  at: string | null;
}

interface FakeMessage {
  id: string;
  organizationId: string;
  title: string;
  body: string;
  sentAt: string;
  sentBy: string;
  audience: string;
  channel: ChannelChoice;
  deliveries: FakeDelivery[];
}

interface AudienceBody {
  programId: string | null;
  eventId: string | null;
  language: string | null;
  body: string;
  channel: ChannelChoice;
}

const GSM7 =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

/** The seeded memberships; accepting an invitation adds to the list for one test only. */
const SEEDED_MEMBERSHIPS = memberships.length;

/** The password policy as the server applies it (L2-053): 12 to 128 characters and not the email's name. */
function passwordProblem(
  password: string | undefined,
  email: string,
): string | null {
  const value = password ?? "";
  if (value.length < 12) return "Use at least 12 characters.";
  if (value.length > 128) return "Use at most 128 characters.";
  const local = email.split("@")[0]!;
  return local.length >= 3 && value.toLowerCase().includes(local.toLowerCase())
    ? "Don’t use your email in your password."
    : null;
}

/** SMS segments as the server counts them: 160/153 GSM-7 characters, 70/67 otherwise. */
function segmentsOf(text: string): number {
  const gsm = [...text].every((c) => GSM7.includes(c));
  const [single, multi] = gsm ? [160, 153] : [70, 67];
  return text.length <= single ? 1 : Math.ceil(text.length / multi);
}

/** The first sentence of a body, or its first 60 characters, as the server titles a message. */
function titleOf(body: string): string {
  const text = body.trim();
  const end = text.search(/[.!?]/);
  if (end > 0 && end < 60) return text.slice(0, end + 1);
  return text.length <= 60 ? text : `${text.slice(0, 59).trimEnd()}…`;
}

interface FakeAttendance {
  status: "NotYet" | "Present" | "Absent" | "SignedOut";
  checkedInAt: string | null;
  /** A check-in after the start, kept through sign-out (L2-095). */
  late?: boolean;
  /** An absence the organization accepts (L2-095). */
  excused?: boolean;
  signedOutAt?: string | null;
  collectedBy?: string | null;
}

interface FakeWalkIn {
  id: string;
  eventId: string;
  childName: string;
  guardian: string;
  medicalNotes: string | null;
}

type Handler = (route: Route, params: Record<string, string>) => Promise<void>;

const MFA_ROLES = new Set(["Admin", "ProgramDirector"]);

/**
 * Answers the real API's contracts from seeded in-memory data. The session is the
 * membership signed in; the tenant always comes from it, never from the request.
 * Any request the fake does not route is recorded and fails the test.
 */
/** The reference a faked fault answers with, as the API's request trace id would be. */
export const FAULT_REFERENCE = "0HNA1B2C3D4E5:00000001";

/** A youth's first-run setup as the API stores it (L2-059). */
export interface FakeOnboarding {
  step: number;
  preferredName: string;
  pronouns: string | null;
  lessonReminders: boolean;
  mentorMessages: boolean;
  announcements: boolean;
  completed: boolean;
}

/** An organization's profile on Settings › Organization (L2-122). */
interface FakeOrganizationDetails {
  name: string;
  city: string;
  contactEmail: string | null;
  phone: string | null;
  timeZone: string;
}

/** Mirrors backend OrganizationTimeZones. */
const FAKE_TIME_ZONES = [
  "America/St_Johns",
  "America/Halifax",
  "America/Toronto",
  "America/Winnipeg",
  "America/Regina",
  "America/Edmonton",
  "America/Vancouver",
  "America/Whitehorse",
];

export class FakeApi {
  readonly unrouted: string[] = [];
  private failures = new Map<string, number>();
  private onboardings = new Map<string, FakeOnboarding>();
  private signInFailures = new Map<string, number>();
  private mfaPending: string | null = null;
  private expired = false;
  // Per-organization module state, copied so tests never share changes.
  private modules = new Map(organizations.map((o) => [o.id, [...o.modules]]));
  private households: FakeHousehold[] = seedHouseholds();
  private programs: FakeProgram[] = seedPrograms();
  private events: FakeEvent[] = seedEvents();
  /** Youth's RSVPs (L2-094): one per event and child. */
  private readonly rsvps: FakeRsvp[] = [];
  /** Attendance by session, then by child or walk-in id. */
  private attendance = new Map<string, Map<string, FakeAttendance>>();
  private walkIns: FakeWalkIn[] = [];
  private actions = new Set<string>();
  private messages: FakeMessage[] = [];
  private slips = new Map<string, FakeSlip>();
  private imports: FakeImport[] = [];
  private enrollmentSlugs = new Map<string, string>();
  private enrollmentRequests: {
    id?: string;
    programId: string;
    status: "WaitingReview" | "Waitlisted" | "Accepted" | "Declined";
    position: number | null;
    childId?: string;
    submittedAt?: string;
    note?: string | null;
    appliedAs?: "Guardian" | "Youth" | "Referrer";
    reason?: string | null;
    seasonConsent?: boolean;
    referrer?: {
      name: string;
      role: string;
      organization: string | null;
      contact: string;
    } | null;
    applicant?: {
      firstName: string;
      lastName: string;
      dateOfBirth: string | null;
    };
    submittedBy?: string;
    householdId?: string;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    notes?: { id: string; author: string; text: string; createdAt: string }[];
  }[] = [];
  /** Incidents as reported: organization, reporter membership and the form's facts. */
  private incidents: {
    id: string;
    organizationId: string;
    reporterId: string;
    reportedBy: string;
    category: string;
    childId: string;
    occurredAt: string;
    place: string;
    whatHappened: string;
    actionTaken: string;
    guardianContact: string;
    severity: string;
    status: "NeedsReview" | "Open" | "Closed";
    reportedAt: string;
    review?: { note: string; outcome: string; by: string; at: string } | null;
    followUps?: { text: string; by: string; at: string }[];
    trail?: { text: string; at: string }[];
  }[] = [];
  /** No-show texts the job sent, and the guardian's reply: "event:child" → state and time. */
  /** In-app notifications: recipient membership, kind, text, link and read time. */
  private notifications: {
    id: string;
    organizationId: string;
    membershipId: string;
    kind: string;
    text: string;
    link: string;
    createdAt: string;
    readAt: string | null;
  }[] = [];
  private noShows = new Map<
    string,
    { state: "TextSent" | "OnTheWay" | "Absent"; at: string }
  >();
  /** Household home links as texted with an enrollment decision: token → household. */
  private homeLinks = new Map<string, string>([
    ["tok-home-tran", "hh-tran"],
    ["tok-home-rivera", "hh-rivera"],
  ]);
  /** The verified enrollment session of this browser: program, contact and draft (the HttpOnly cookie, in the fake). */
  /** Codes sent per program and contact in the current 15-minute window (L2-071 criterion 9). */
  private enrollCodes = new Map<string, number>();
  private enrollSession: {
    programId: string;
    contact: string;
    householdId: string | null;
    draft: FakeEnrollDraft | null;
    submitted: boolean;
  } | null = null;
  /** Guardian links as texted with a sent slip: token → household, child and event. */
  private guardianLinks = new Map<
    string,
    { householdId: string; childId: string; eventId: string; expired?: boolean }
  >([
    [
      "tok-mateo",
      { householdId: "hh-rivera", childId: "c-mateo", eventId: "e-rbg" },
    ],
    [
      "tok-sofia",
      { householdId: "hh-rivera", childId: "c-sofia", eventId: "e-rbg" },
    ],
    [
      "tok-jordan",
      { householdId: "hh-thompson", childId: "c-jordan", eventId: "e-rbg" },
    ],
    [
      "tok-expired",
      {
        householdId: "hh-rivera",
        childId: "c-mateo",
        eventId: "e-rbg",
        expired: true,
      },
    ],
  ]);
  /** Consent links as texted or emailed (ADR 0046): token → household and child; an expired one is over 30 days old or replaced. */
  private consentLinks = new Map<
    string,
    { householdId: string; childId: string; expired?: boolean }
  >([
    ["tok-consent-sofia", { householdId: "hh-rivera", childId: "c-sofia" }],
    [
      "tok-consent-expired",
      { householdId: "hh-rivera", childId: "c-sofia", expired: true },
    ],
  ]);
  /** Guardian consents given in this test, newest last (L2-055, L2-058). */
  private consents: {
    childId: string;
    signedBy: string;
    relationship: string;
    signedAt: string;
    reference: string;
    withdrawnAt: string | null;
    withdrawnBy: string | null;
  }[] = [];
  /** Children whose consent link was sent in this test, with when (L2-056, L2-058). */
  consentLinksSent = new Map<string, string>();
  /** Households whose device has verified a code (the HttpOnly cookie, in the fake). */
  private trustedHouseholds = new Set<string>();
  /** Survey links as texted after an event: token → household, child and event; answers by token. */
  private surveyLinks = new Map<
    string,
    {
      householdId: string;
      childId: string;
      eventId: string;
      organizationId: string;
      closed?: boolean;
    }
  >([
    [
      "tok-survey-mateo",
      {
        householdId: "hh-rivera",
        childId: "c-mateo",
        eventId: "e-tutoring-today",
        organizationId: "org-harbourview",
      },
    ],
  ]);
  private surveyAnswers = new Map<
    string,
    { rating: number; comment: string | null }
  >();
  private wrongCodes = new Map<string, number>();
  private lockedLinks = new Set<string>();
  /** The six-digit code the fake texts to a contact on file. */
  readonly guardianCode = "482913";
  private smsUsed = new Map<string, number>();
  /** Password reset links: token → email and whether it is still usable. */
  private resetLinks = new Map<string, { email: string; usable: boolean }>([
    ["tok-reset-jaylen", { email: "jaylen@harbourview.example", usable: true }],
    ["tok-reset-sofia", { email: "sofia@harbourview.example", usable: true }],
    ["tok-reset-daniel", { email: "daniel@harbourview.example", usable: true }],
    ["tok-reset-lucia", { email: "lucia@northgate.example", usable: true }],
    ["tok-reset-samuel", { email: "samuel@northgate.example", usable: true }],
  ]);
  resetRequestedFor: string | null = null;
  /** Reset emails sent per address, all within the fake's one hour. */
  private resetEmails = new Map<string, number>();
  /** Recovery codes left per person, and whether the other devices were signed out. */
  private recoveryCodes = new Map<string, number>();
  /** Saved profiles by membership (L2-117); a membership without one shows its seeded name. */
  private readonly profiles = new Map<
    string,
    { name: string; mobile: string | null }
  >();
  /** Display preferences by person (email), as saved on Display (L2-119, L2-120). */
  private readonly displays = new Map<string, FakeDisplay>();
  /** Passwords changed by their owner (L2-118), by email; everyone else signs in with the seeded one. */
  private readonly passwords = new Map<string, string>();
  signedOutOthers = false;
  /** The audit log as the API keeps it: organization, when, who, action, record type and summary. */
  private auditEntries: {
    organizationId: string;
    when: string;
    who: string;
    action: string;
    record: string;
    summary: string;
    device: string | null;
  }[] = [
    {
      organizationId: "org-harbourview",
      when: "2026-11-05T20:41:00Z",
      who: "Carmen Rivera",
      action: "Signed",
      record: "PermissionSlip",
      summary: "Mateo Rivera · signed by Carmen Rivera · version 1",
      device: "Phone",
    },
    {
      organizationId: "org-harbourview",
      when: "2026-11-05T18:10:00Z",
      who: "Tom Nguyen",
      action: "Updated",
      record: "Enrollment",
      summary: "Kevin Tran · After-School Tutoring · accepted",
      device: "Laptop",
    },
    {
      organizationId: "org-harbourview",
      when: "2026-11-02T14:10:00Z",
      who: "Tom Nguyen",
      action: "Viewed",
      record: "ChildMedical",
      summary: "Mateo Rivera · medical details",
      device: "Laptop",
    },
    {
      organizationId: "org-harbourview",
      when: "2026-10-20T15:00:00Z",
      who: "Marisol Delgado",
      action: "Exported",
      record: "ReportExport",
      summary: "harbourview-youth-collective-report.csv · CSV · 12 rows",
      device: "Laptop",
    },
    {
      organizationId: "org-northgate",
      when: "2026-11-04T12:00:00Z",
      who: "Grace Mensah",
      action: "Updated",
      record: "Organization",
      summary: "Northgate Kids · Burlington",
      device: null,
    },
  ];
  /** Consent retention per organization, when saved (null: until deleted by request); otherwise 7 years. */
  private retention = new Map<string, number | null>();
  /** Consent policies saved per organization (L2-056); otherwise 18 and the default wording. */
  private consentPolicies = new Map<
    string,
    { consentAge: number; wording: string }
  >();
  /** Guardian data requests: household, kind, email and who fulfilled it. */
  private dataRequests: {
    id: string;
    organizationId: string;
    householdId: string;
    household: string;
    kind: "Export" | "Delete";
    email: string;
    fulfilledBy: string | null;
  }[] = [];
  /** Plans changed in billing, and organizations whose last payment failed (with when). */
  private plans = new Map<string, "Free" | "Standard" | "Plus">();
  private paymentFailed = new Map<string, string>();
  /** Organizations whose admin confirmed name and city in setup (Harbourview did, as seeded), with any new profile. */
  private profiles = new Map<string, { name: string; city: string }>([
    [
      "org-harbourview",
      { name: "Harbourview Youth Collective", city: "Hamilton, Ontario" },
    ],
  ]);
  /** Profiles saved on Settings › Organization (L2-122), by organization; others show their seeded profile. */
  private readonly organizationDetails = new Map<
    string,
    FakeOrganizationDetails
  >();
  /** How often mentors check in, in days, by organization (L2-125); 14 until changed. */
  private readonly mentorCheckInDays = new Map<string, number>();
  /** Website profiles saved on Settings › Organization (L2-126), by organization; the address starts as the seeded slug. */
  private readonly websiteProfiles = new Map<
    string,
    {
      slug: string;
      tagline: string | null;
      about: string | null;
      contactEmail: string | null;
    }
  >();
  /** Logos uploaded on Settings › Organization (L2-123), by organization. */
  private readonly organizationLogos = new Map<
    string,
    {
      fileName: string;
      uploadedAt: string;
      uploadedBy: string;
      contentType: string;
      bytes: Buffer;
    }
  >();
  /** Report exports by id: organization, file name and CSV. */
  private reportExports = new Map<
    string,
    { organizationId: string; fileName: string; csv: string }
  >();
  /** Notification settings per organization, when saved; otherwise the defaults. */
  private notificationSettings = new Map<
    string,
    {
      noShowDelayMinutes: number;
      emailSupervisorsOnIncidents: boolean;
      smsCap: number;
    }
  >();
  /** Who works each session; youth workers run only these (as seeded: Jaylen and Aisha tonight). */
  private sessionStaff = new Map<string, string[]>([
    ["e-tutoring-today", ["m-jaylen", "m-aisha", "m-leo"]],
    ["e-sports", ["m-leo"]],
  ]);
  /** Youth accounts and the child each links to (L2-045), as the seed links them. */
  private youthLinks = new Map<string, string>([
    ["m-sofia", "c-sofia"],
    ["m-nadia", "c-nadia"],
    ["m-lucia", "c-ng-lucia"],
  ]);
  private nextId = 1;

  constructor(private membershipId: string | null) {
    // Memberships joined by accepting an invitation in an earlier test of this worker are forgotten.
    memberships.splice(SEEDED_MEMBERSHIPS);
  }

  /** Who is staffed onto a session, as a coordinator assigning coverage would (L2-009 criterion 8). */
  setSessionStaff(eventId: string, membershipIds: string[]): void {
    this.sessionStaff.set(eventId, [...membershipIds]);
  }

  /** Makes the next calls to a route answer with the given status, as the real API would on a fault. */
  failNext(path: string, status: number): void {
    this.failures.set(path, status);
  }

  /** The route answers normally again after failNext. */
  recover(path: string): void {
    this.failures.delete(path);
  }

  /** Marks a child at a session, as Roll Call would: Present (late when asked) or Absent (excused when asked). */
  markAttendance(
    eventId: string,
    childId: string,
    status: "Present" | "Absent",
    flags: { late?: boolean; excused?: boolean } = {},
  ): void {
    this.sessionRecords(eventId).set(childId, {
      status,
      checkedInAt: status === "Present" ? NOW.toISOString() : null,
      late: status === "Present" && !!flags.late,
      excused: status === "Absent" && !!flags.excused,
    });
  }

  /** Puts a child on a program's roster, as staff enrolling them would (the youth's placement, L2-060). */
  placeInProgram(childId: string, programId: string): void {
    const program = this.programs.find((x) => x.id === programId)!;
    if (!program.roster.includes(childId)) program.roster.push(childId);
  }

  /** A youth's saved first-run setup, as the API stores it (L2-059); undefined until the first step is saved. */
  onboardingOf(membershipId: string): FakeOnboarding | undefined {
    return this.onboardings.get(membershipId);
  }

  /** A youth who already saved part of the setup, or finished it. */
  saveOnboarding(membershipId: string, setup: Partial<FakeOnboarding>): void {
    this.onboardings.set(membershipId, {
      step: 1,
      preferredName: "",
      pronouns: null,
      lessonReminders: true,
      mentorMessages: true,
      announcements: false,
      completed: false,
      ...setup,
    });
  }

  /** Opens a program's enrollment, as a director would; the link is /g/enroll/<program-name>. */
  openEnrollment(programId: string): string {
    const program = this.programs.find((x) => x.id === programId)!;
    const slug = program.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    this.enrollmentSlugs.set(programId, slug);
    program.enrollmentOpen = true;
    return slug;
  }

  /** A child of a seeded household who asked to enroll in a program, waiting for review. */
  requestEnrollment(
    programId: string,
    childId: string,
    submittedAt = "2026-11-02T15:00:00Z",
  ): void {
    this.enrollmentRequests.push({
      id: `er-${this.nextId++}`,
      programId,
      status: "WaitingReview",
      position: null,
      childId,
      submittedAt,
    });
  }

  /** A child's enrollment as staff decided it, with the note the guardian reads; an accepted child is on the roster. */
  decideEnrollment(
    programId: string,
    childId: string,
    status: "Accepted" | "Waitlisted" | "Declined",
    note: string | null = null,
  ): void {
    const position =
      status === "Waitlisted"
        ? this.enrollmentRequests.filter(
            (r) => r.programId === programId && r.status === "Waitlisted",
          ).length + 1
        : null;
    this.enrollmentRequests.push({
      id: `er-${this.nextId++}`,
      programId,
      status,
      position,
      childId,
      submittedAt: "2026-11-02T15:00:00Z",
      note,
    });
    if (status === "Accepted")
      this.programs.find((x) => x.id === programId)!.roster.push(childId);
  }

  /** The no-show job texted this child's household; a reply of 2 also marks the child absent, as the API does. */
  noShowAlert(
    eventId: string,
    childId: string,
    state: "TextSent" | "OnTheWay" | "Absent" = "TextSent",
    at = "2026-10-21T20:15:00Z",
  ): void {
    this.noShows.set(`${eventId}:${childId}`, { state, at });
    if (state === "Absent")
      this.sessionRecords(eventId).set(childId, {
        status: "Absent",
        checkedInAt: null,
      });
  }

  /** An incident someone already reported (seeded as the API would store it). */
  reportIncident(
    reporterId: string,
    category: string,
    childId: string,
  ): string {
    const m = memberships.find((x) => x.id === reporterId)!;
    const id = `inc-${this.nextId++}`;
    this.incidents.push({
      id,
      organizationId: m.organizationId,
      reporterId,
      reportedBy: m.personName,
      category,
      childId,
      occurredAt: "2026-10-21T18:40:00Z",
      place: "Gym",
      whatHappened: "Fell during the relay.",
      actionTaken: "Ice pack.",
      guardianContact: "LeftMessage",
      severity: "Minor",
      status: "NeedsReview",
      reportedAt: NOW.toISOString(),
    });
    this.notifyIncident(m, id, childId, category);
    return id;
  }

  /** Takes a household's children off every roster, as if they never enrolled. */
  unenrollHousehold(householdId: string): void {
    const ids = this.households
      .find((h) => h.id === householdId)!
      .children.map((c) => c.id);
    for (const p of this.programs)
      p.roster = p.roster.filter((id) => !ids.includes(id));
  }

  /** Closes a program's enrollment; its link stays the same. */
  closeEnrollment(programId: string): void {
    this.programs.find((x) => x.id === programId)!.enrollmentOpen = false;
  }

  /** An open application already waiting review for a young person, as if submitted earlier (L2-071 criterion 8). */
  applied(
    programId: string,
    applicant: { firstName: string; lastName: string; dateOfBirth: string },
  ): void {
    this.enrollmentRequests.push({
      programId,
      status: "WaitingReview",
      position: null,
      appliedAs: "Youth",
      seasonConsent: false,
      applicant,
    });
  }

  /**
   * An application as the server stores it after a link submission (L2-071, L2-072): a new household with the guardian and the
   * young person's child record, and the request waiting review. Answers the request id.
   */
  application(
    programId: string,
    a: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      appliedAs: "Guardian" | "Youth" | "Referrer";
      guardian: { name: string; mobile: string };
      reason?: string | null;
      referrer?: {
        name: string;
        role: string;
        organization: string | null;
        contact: string;
      } | null;
      submittedAt: string;
    },
  ): string {
    const program = this.programs.find((x) => x.id === programId)!;
    const n = this.nextId++;
    const householdId = `hh-app-${n}`;
    const childId = `c-app-${n}`;
    this.households.push({
      id: householdId,
      organizationId: program.organizationId,
      name: a.lastName,
      language: "English",
      guardians: [
        {
          id: `g-app-${n}`,
          name: a.guardian.name,
          relationship: "Parent",
          mobile: a.guardian.mobile,
          email: null,
          language: "English",
          isPrimary: true,
          canPickUp: true,
          canSign: true,
        },
      ],
      children: [
        {
          id: childId,
          firstName: a.firstName,
          lastName: a.lastName,
          dateOfBirth: a.dateOfBirth,
          school: null,
          medical: {
            allergies: null,
            medication: null,
            conditions: null,
            doctor: null,
            redAlert: false,
            updatedAt: null,
            updatedBy: null,
          },
        },
      ],
    });
    const id = `er-${this.nextId++}`;
    this.enrollmentRequests.push({
      id,
      programId,
      status: "WaitingReview",
      position: null,
      childId,
      householdId,
      submittedAt: a.submittedAt,
      appliedAs: a.appliedAs,
      reason: a.reason ?? null,
      seasonConsent: a.appliedAs === "Guardian",
      referrer: a.referrer ?? null,
      applicant: {
        firstName: a.firstName,
        lastName: a.lastName,
        dateOfBirth: a.dateOfBirth,
      },
      submittedBy:
        a.appliedAs === "Referrer"
          ? a.referrer!.name
          : a.appliedAs === "Youth"
            ? `${a.firstName} ${a.lastName}`
            : a.guardian.name,
    });
    return id;
  }

  /** The youth invitation waiting for a child, if any (L2-051). */
  youthInvitationFor(childId: string) {
    return this.invitations.find((i) => i.childId === childId && !i.withdrawn);
  }

  /** The application with this id, as the server holds it. */
  applicationById(id: string) {
    return this.enrollmentRequests.find((r) => r.id === id)!;
  }

  /** A staff note already on an application. */
  noteApplication(
    id: string,
    author: string,
    text: string,
    createdAt = "2026-11-05T19:15:00Z",
  ): void {
    const r = this.enrollmentRequests.find((x) => x.id === id)!;
    (r.notes ??= []).push({
      id: `note-${this.nextId++}`,
      author,
      text,
      createdAt,
    });
  }

  /** Zoe Campbell, 13, referred by Rachel Ellis to a program (the cast of L2-071). */
  referZoe(programId: string, submittedAt = "2026-11-05T18:02:00Z"): string {
    return this.application(programId, {
      firstName: "Zoe",
      lastName: "Campbell",
      dateOfBirth: "2013-03-14",
      appliedAs: "Referrer",
      guardian: { name: "Tanya Campbell", mobile: "905-555-0320" },
      reason:
        "Zoe is curious and kind, and needs somewhere to belong after school.",
      referrer: {
        name: "Rachel Ellis",
        role: "Guidance counsellor",
        organization: "Bennetto Elementary",
        contact: "rachel.ellis@bennetto.example.ca",
      },
      submittedAt,
    });
  }

  /** Malik Johnson, 14, applying for himself to a program (the cast of L2-071). */
  malikApplies(
    programId: string,
    submittedAt = "2026-11-04T23:48:00Z",
  ): string {
    return this.application(programId, {
      firstName: "Malik",
      lastName: "Johnson",
      dateOfBirth: "2012-06-02",
      appliedAs: "Youth",
      guardian: { name: "Denise Johnson", mobile: "905-555-0310" },
      reason: "I want to learn to code and help with the younger kids.",
      submittedAt,
    });
  }

  enrollmentRequestCount(programId: string): number {
    return this.enrollmentRequests.filter((r) => r.programId === programId)
      .length;
  }

  /** The last enrollment request submitted through a link, as the server would store it (L2-071). */
  lastEnrollmentRequest() {
    return this.enrollmentRequests[this.enrollmentRequests.length - 1];
  }

  /** Fills a program to capacity with accepted enrollments. */
  fillProgram(programId: string): void {
    const program = this.programs.find((x) => x.id === programId)!;
    program.capacity = program.roster.length;
  }

  /** Takes away every way to reach a household: no mobile, and its email bounced. */
  makeUnreachable(householdId: string): void {
    for (const g of this.households.find((h) => h.id === householdId)!
      .guardians) {
      g.mobile = null;
      g.emailBounced = true;
    }
  }

  /** A message staff sent from Messages to households, already delivered, as the guardian's announcements read it (L2-103). */
  announce(
    householdIds: string[],
    body: string,
    at: string,
    by = "Marisol Delgado",
    read = false,
  ): void {
    const households = this.households.filter((h) =>
      householdIds.includes(h.id),
    );
    this.messages.push({
      id: `msg-${this.nextId++}`,
      organizationId: households[0]!.organizationId,
      title: titleOf(body),
      body,
      sentAt: at,
      sentBy: by,
      audience: "After-School Tutoring",
      channel: "TextWithEmailFallback",
      deliveries: households.map((h) => ({
        household: h.name,
        householdId: h.id,
        guardian: null,
        channel: "Sms",
        language: h.language,
        status: "Sent",
        reason: null,
        at,
        readAt: read ? at : null,
      })),
    });
  }

  /** Changes a household's language, as the guardian's Update your details would (L2-027). */
  setHouseholdLanguage(
    householdId: string,
    language: "English" | "Spanish" | "French",
  ): void {
    this.households.find((h) => h.id === householdId)!.language = language;
  }

  /** Trusts this browser for a household, as a verified code would. */
  trustGuardianDevice(householdId: string): void {
    this.trustedHouseholds.add(householdId);
  }

  /** A guardian's answer for one child, as the guardian slip page will record it. */
  answerSlip(
    eventId: string,
    childId: string,
    status: "Signed" | "Declined",
    by = "Carmen Rivera",
  ): void {
    const slip = this.slipOf(eventId)!;
    slip.answers.set(childId, { status, by, version: slip.version });
  }

  /** Writes and sends an event's slip, as a director would. */
  sendSlip(
    eventId: string,
    body = "We’re taking the After-School Tutoring group to the Royal Botanical Gardens.",
  ): void {
    const slip = this.slipOf(eventId)!;
    Object.assign(slip, {
      body,
      signBy: "2026-11-12",
      status: "Sent",
      sentAt: NOW.toISOString(),
    });
    this.events.find((e) => e.id === eventId)!.slipStatus = "Sent";
  }

  /** Sets the SMS segments an organization has used this month (the cap is 2,000 on Standard, 200 on Free). */
  setSmsUsed(organizationId: string, used: number): void {
    this.smsUsed.set(organizationId, used);
  }

  /** Adds a session tonight in After-School Tutoring with no staff assigned, as a director would. */
  addSessionTonight(name: string): void {
    const base = this.events.find((e) => e.id === "e-tutoring-today")!;
    this.events.push({
      ...base,
      id: `e-${this.nextId++}`,
      name,
      startsAt: "2026-11-05T23:00:00Z",
      endsAt: "2026-11-06T00:00:00Z",
      place: "Room 3",
    });
  }

  /** Curriculum authoring state (tracks, modules, lessons); tests call its helpers, such as clear. */
  readonly curriculumState = new FakeCurriculum(() => this.programs);

  /** A youth's lessons and progress (L2-068 to L2-070); tests mark lessons done with learningState.complete. */
  readonly learningState = new FakeLearning(this.curriculumState);
  /** Youth reflections (L2-089); tests seed and read them through it. */
  readonly reflectionsState = new FakeReflections();
  /** Mentor check-ins (L2-090). */
  readonly mentorCheckIns = new FakeMentorCheckIns();
  /** At-risk flags (L2-091). */
  readonly atRiskFlags = new FakeAtRiskFlags();
  /** Direct messages (L2-106); tests seed them and reply as the other side. */
  readonly conversations = new FakeConversations();
  /** Announcements (L2-105); tests seed and read them through it. */
  readonly announcements = new FakeAnnouncements();
  /** Work mentors assigned (L2-092); tests read and seed it. */
  readonly assignedWork = new FakeAssignedWorkStore(this.curriculumState);

  /** Badges and their awards (L2-084, L2-085); tests read and change it, such as clear. */
  readonly badges = new FakeBadges(
    this.curriculumState,
    () => this.reviews.competencies,
    () => memberships,
  );

  /** The progression framework (L2-086); its competencies are the ones mentors assess in reviews. */
  readonly progression = new FakeProgression(() => this.reviews.competencies);

  /** The audit entries recorded for a record type, oldest first. */
  auditOf(record: string): { who: string; action: string; summary: string }[] {
    return this.auditEntries.filter((e) => e.record === record);
  }

  /** Sets how often mentors check in, as Settings › Organization would (L2-125). */
  setMentorCheckInDays(organizationId: string, days: number): void {
    this.mentorCheckInDays.set(organizationId, days);
  }

  /** Writes an organization's website profile, as Settings › Organization would (L2-126). */
  setWebsiteProfile(
    organizationId: string,
    profile: { tagline?: string | null; about?: string | null; contactEmail?: string | null },
  ): void {
    this.websiteProfiles.set(organizationId, { ...this.websiteProfileOf(organizationId), ...profile });
  }

  /** Archives a seeded program, as a director would. */
  archiveSeededProgram(programId: string): void {
    const program = this.programs.find((p) => p.id === programId)!;
    program.status = "Archived";
    program.archivedAt = "2026-11-01T12:00:00Z";
    program.archivedBy = "Marisol Delgado";
  }

  /** Publishes a curriculum module, as an author would. */
  publishModule(moduleId: string): void {
    this.curriculumState.modules.find((m) => m.id === moduleId)!.status = "Published";
  }

  /** Sets the modules on for an organization, as Settings › Modules would. */
  setModules(organizationId: string, on: ModuleId[]): void {
    this.modules.set(organizationId, on);
  }

  /** A weekly series of sessions for a program, from the first start through the program's last day, as Repeat weekly would make. */
  addWeeklySessions(
    programId: string,
    name: string,
    first: string,
    place: string,
  ): void {
    const program = this.programs.find((p) => p.id === programId)!;
    const seriesId = `series-${this.nextId++}`;
    for (const startsAt of weeklyStarts(first, program.endsOn).slice(0, 60)) {
      this.events.push({
        id: `e-weekly-${this.nextId++}`,
        organizationId: program.organizationId,
        programId,
        name,
        startsAt,
        endsAt: new Date(
          new Date(startsAt).getTime() + 2 * 3_600_000,
        ).toISOString(),
        place,
        requiresSlip: false,
        noShowAlert: true,
        staffNotes: null,
        status: "Scheduled",
        slipStatus: "NotNeeded",
        cancelledAt: null,
        cancelledBy: null,
        cancellationMessage: null,
        guardiansTold: false,
        seriesId,
      });
    }
  }

  /** A youth's answer saved earlier, as if she had sent it. */
  seedRsvp(row: Omit<FakeRsvp, "answeredAt"> & { answeredAt?: string }): void {
    this.rsvps.push({ answeredAt: NOW.toISOString(), ...row });
  }

  /** Cancels a session, as a director cancelling it without telling guardians would. */
  cancelSession(eventId: string): void {
    Object.assign(
      this.events.find((e) => e.id === eventId)!,
      {
        status: "Cancelled",
        cancelledAt: NOW.toISOString(),
        cancelledBy: "Marisol Delgado",
      },
    );
  }

  /** Removes every household of an organization, for empty states. */
  clearHouseholds(organizationId: string): void {
    this.households = this.households.filter(
      (h) => h.organizationId !== organizationId,
    );
  }

  /** The session cookie stops authenticating, as after 12 idle hours. */
  expireSession(): void {
    this.expired = true;
    this.membershipId = null;
  }

  async install(page: Page, appOrigin: string): Promise<void> {
    await page.route(
      (url) => url.origin !== appOrigin,
      (route) => this.reject(route),
    );
    await page.route(`${appOrigin}/api/**`, (route) => this.handle(route));
  }

  private readonly routes: [string, RegExp, Handler][] = [
    ["GET", /^\/api\/me$/, (route) => this.me(route)],
    ["GET", /^\/api\/learning\/me$/, (route) => this.learner(route)],
    [
      "GET",
      /^\/api\/learning\/progress$/,
      (route) =>
        this.youthWork(route, (m, programs) =>
          this.journey.progress(
            route,
            m,
            programs,
            this.youthLinks.get(m.id) ?? null,
            this.youthAttendance(m),
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/badges$/,
      (route) =>
        this.youthWork(route, (m, programs) =>
          this.journey.badges(route, m, programs),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/journey$/,
      (route) =>
        this.youthWork(route, (m, programs) =>
          this.journey.journey(
            route,
            m,
            programs,
            this.youthLinks.get(m.id) ?? null,
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/home$/,
      (route) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.home(route, m.id, programs, this.assignedTo(m)),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/tracks\/(?<id>[^/]+)$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.track(route, m.id, programs, p["id"]!),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/modules\/(?<id>[^/]+)$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.module(route, m.id, programs, p["id"]!),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/lessons\/(?<id>[^/]+)$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.lesson(route, m.id, programs, p["id"]!),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/lessons\/(?<id>[^/]+)\/reflection$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.reflectionEditor(route, m, programs, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/learning\/lessons\/(?<id>[^/]+)\/reflection$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.reflectionsState.save(
            route,
            m.organizationId,
            m.id,
            this.learningState.findLesson(
              this.learningState.tracks(m.id, programs),
              p["id"]!,
            ),
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/lessons\/(?<id>[^/]+)\/video$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.video(route, m.id, programs, p["id"]!),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/coding\/(?<id>[^/]+)$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.coding(route, m.id, programs, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/learning\/coding\/(?<id>[^/]+)\/progress$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.afterLearning(
            m,
            this.learningState.saveCoding(route, m.id, programs, p["id"]!),
          ),
        ),
    ],
    [
      "POST",
      /^\/api\/learning\/coding\/(?<id>[^/]+)\/submission$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.submit(route, m.id, programs, p["id"]!),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/quizzes\/(?<id>[^/]+)$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.quizzes.intro(
            route,
            m.id,
            this.learningState.quizPlace(m.id, programs, p["id"]!),
          ),
        ),
    ],
    [
      "POST",
      /^\/api\/learning\/quizzes\/(?<id>[^/]+)\/attempts$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.quizzes.start(
            route,
            m.id,
            this.learningState.quizPlace(m.id, programs, p["id"]!),
          ),
        ),
    ],
    [
      "PUT",
      /^\/api\/learning\/attempts\/(?<id>[^/]+)\/answers$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.quizzes.save(route, m.id, p["id"]!, (q) =>
            this.learningState.quizPlace(m.id, programs, q),
          ),
        ),
    ],
    [
      "POST",
      /^\/api\/learning\/attempts\/(?<id>[^/]+)\/submit$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.afterLearning(
            m,
            this.learningState.quizzes.submit(route, m.id, p["id"]!, (q) =>
              this.learningState.quizPlace(m.id, programs, q),
            ),
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/attempts\/(?<id>[^/]+)$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.quizzes.result(route, m.id, p["id"]!, (q) =>
            this.learningState.quizPlace(m.id, programs, q),
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/quizzes\/(?<id>[^/]+)$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.quizzes.intro(
            route,
            m.id,
            this.learningState.quizPlace(m.id, programs, p["id"]!),
          ),
        ),
    ],
    [
      "POST",
      /^\/api\/learning\/quizzes\/(?<id>[^/]+)\/attempts$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.quizzes.start(
            route,
            m.id,
            this.learningState.quizPlace(m.id, programs, p["id"]!),
          ),
        ),
    ],
    [
      "PUT",
      /^\/api\/learning\/attempts\/(?<id>[^/]+)\/answers$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.quizzes.save(route, m.id, p["id"]!, (q) =>
            this.learningState.quizPlace(m.id, programs, q),
          ),
        ),
    ],
    [
      "POST",
      /^\/api\/learning\/attempts\/(?<id>[^/]+)\/submit$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.afterLearning(
            m,
            this.learningState.quizzes.submit(route, m.id, p["id"]!, (q) =>
              this.learningState.quizPlace(m.id, programs, q),
            ),
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/attempts\/(?<id>[^/]+)$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.quizzes.result(route, m.id, p["id"]!, (q) =>
            this.learningState.quizPlace(m.id, programs, q),
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/assignments\/(?<id>[^/]+)$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.assignmentBrief(route, m, programs, p["id"]!),
        ),
    ],
    [
      "POST",
      /^\/api\/learning\/assignments\/(?<id>[^/]+)\/submission$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.work.submit(
            route,
            m.id,
            m.personName,
            this.learningState.assignmentPlace(m.id, programs, p["id"]!),
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/submissions\/(?<id>[^/]+)$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.work.view(
            route,
            m.id,
            p["id"]!,
            (a) => this.learningState.assignmentPlace(m.id, programs, a),
            (t) => this.youthMentorName(m, t),
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/learning\/submissions\/(?<id>[^/]+)\/file$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.work.file(route, m.id, p["id"]!, (a) =>
            this.learningState.assignmentPlace(m.id, programs, a),
          ),
        ),
    ],
    [
      "POST",
      /^\/api\/learning\/submissions\/(?<id>[^/]+)\/resubmit$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.learningState.work.resubmit(
            route,
            m.id,
            m.personName,
            p["id"]!,
            (a) => this.learningState.assignmentPlace(m.id, programs, a),
          ),
        ),
    ],
    [
      "POST",
      /^\/api\/learning\/lessons\/(?<id>[^/]+)\/complete$/,
      (route, p) =>
        this.youthWork(route, (m, programs) =>
          this.afterLearning(
            m,
            this.learningState.completeLesson(route, m.id, programs, p["id"]!),
          ),
        ),
    ],
    [
      "POST",
      /^\/api\/learning\/consent-request$/,
      (route) => this.askGuardian(route),
    ],
    ["GET", /^\/api\/learning\/onboarding$/, (route) => this.onboarding(route)],
    [
      "PUT",
      /^\/api\/learning\/onboarding$/,
      (route) => this.saveOnboardingStep(route),
    ],
    [
      "POST",
      /^\/api\/learning\/onboarding\/complete$/,
      (route) => this.completeOnboarding(route),
    ],
    [
      "GET",
      /^\/api\/curriculum$/,
      (route) =>
        this.author(route, (org) => this.curriculumState.list(route, org)),
    ],
    [
      "POST",
      /^\/api\/curriculum\/tracks$/,
      (route) =>
        this.author(route, (org) =>
          this.curriculumState.createTrack(route, org),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/tracks\/(?<id>[^/]+)\/module-order$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.reorderModules(route, org, p["id"]!),
        ),
    ],
    [
      "POST",
      /^\/api\/curriculum\/modules$/,
      (route) =>
        this.author(route, (org) =>
          this.curriculumState.createModule(route, org),
        ),
    ],
    [
      "GET",
      /^\/api\/curriculum\/modules\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.getModule(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/modules\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.updateModule(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/tracks\/(?<id>[^/]+)\/cohorts$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.setCohorts(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/tracks\/(?<id>[^/]+)\/status$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.setTrackStatus(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/modules\/(?<id>[^/]+)\/status$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.setModuleStatus(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/modules\/(?<id>[^/]+)\/lesson-order$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.reorderLessons(route, org, p["id"]!),
        ),
    ],
    [
      "POST",
      /^\/api\/curriculum\/lessons$/,
      (route) =>
        this.author(route, (org) =>
          this.curriculumState.createLesson(route, org),
        ),
    ],
    [
      "GET",
      /^\/api\/curriculum\/lessons\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.getLesson(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/lessons\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.updateLesson(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/lessons\/(?<id>[^/]+)\/status$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.setLessonStatus(route, org, p["id"]!),
        ),
    ],
    [
      "DELETE",
      /^\/api\/curriculum\/lessons\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.deleteLesson(route, org, p["id"]!),
        ),
    ],
    [
      "POST",
      /^\/api\/curriculum\/quizzes$/,
      (route) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.createQuiz(route, org),
        ),
    ],
    [
      "GET",
      /^\/api\/curriculum\/quizzes\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.getQuiz(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/quizzes\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.updateQuiz(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/quizzes\/(?<id>[^/]+)\/question-order$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.reorderQuestions(
            route,
            org,
            p["id"]!,
          ),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/quizzes\/(?<id>[^/]+)\/status$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.setQuizStatus(route, org, p["id"]!),
        ),
    ],
    [
      "POST",
      /^\/api\/curriculum\/quizzes\/(?<id>[^/]+)\/questions$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.addQuestion(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/quiz-questions\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.updateQuestion(route, org, p["id"]!),
        ),
    ],
    [
      "DELETE",
      /^\/api\/curriculum\/quiz-questions\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.deleteQuestion(route, org, p["id"]!),
        ),
    ],
    [
      "POST",
      /^\/api\/curriculum\/assignments$/,
      (route) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.createAssignment(route, org),
        ),
    ],
    [
      "GET",
      /^\/api\/curriculum\/assignments\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.getAssignment(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/assignments\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.updateAssignment(
            route,
            org,
            p["id"]!,
          ),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/assignments\/(?<id>[^/]+)\/status$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.assessments.setAssignmentStatus(
            route,
            org,
            p["id"]!,
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/curriculum\/badges$/,
      (route) => this.author(route, (org) => this.badges.list(route, org)),
    ],
    [
      "GET",
      /^\/api\/curriculum\/badges\/options$/,
      (route) => this.author(route, (org) => this.badges.options(route, org)),
    ],
    [
      "GET",
      /^\/api\/curriculum\/badges\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) => this.badges.get(route, org, p["id"]!)),
    ],
    [
      "POST",
      /^\/api\/curriculum\/badges$/,
      (route) => this.author(route, (org) => this.badges.create(route, org)),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/badges\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) => this.badges.update(route, org, p["id"]!)),
    ],
    [
      "DELETE",
      /^\/api\/curriculum\/badges\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) => this.badges.remove(route, org, p["id"]!)),
    ],
    [
      "POST",
      /^\/api\/curriculum\/badges\/(?<id>[^/]+)\/awards$/,
      (route, p) =>
        this.author(route, (org) =>
          this.awardBadgeByHand(route, org, p["id"]!),
        ),
    ],
    [
      "GET",
      /^\/api\/curriculum\/progression$/,
      (route) => this.author(route, (org) => this.progression.get(route, org)),
    ],
    [
      "POST",
      /^\/api\/curriculum\/progression\/stages$/,
      (route) =>
        this.author(route, (org) => this.progression.addStage(route, org)),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/progression\/stages\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.progression.updateStage(route, org, p["id"]!),
        ),
    ],
    [
      "PUT",
      /^\/api\/curriculum\/progression\/stage-order$/,
      (route) =>
        this.author(route, (org) => this.progression.reorder(route, org)),
    ],
    [
      "POST",
      /^\/api\/curriculum\/progression\/stages\/(?<id>[^/]+)\/competencies$/,
      (route, p) =>
        this.author(route, (org) =>
          this.progression.addCompetency(route, org, p["id"]!),
        ),
    ],
    [
      "DELETE",
      /^\/api\/curriculum\/progression\/competencies\/(?<id>[^/]+)$/,
      (route, p) =>
        this.author(route, (org) =>
          this.progression.removeCompetency(route, org, p["id"]!),
        ),
    ],
    [
      "POST",
      /^\/api\/curriculum\/lessons\/(?<id>[^/]+)\/video$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.uploadVideo(
            route,
            org,
            p["id"]!,
            memberships.find((x) => x.id === this.membershipId)!.personName,
          ),
        ),
    ],
    [
      "DELETE",
      /^\/api\/curriculum\/lessons\/(?<id>[^/]+)\/video$/,
      (route, p) =>
        this.author(route, (org) =>
          this.curriculumState.removeVideo(route, org, p["id"]!),
        ),
    ],
    ["GET", /^\/api\/mentoring\/youth$/, (route) => this.mentoredYouth(route)],
    [
      "GET",
      /^\/api\/mentoring\/dashboard$/,
      (route) => this.mentorDashboard(route),
    ],
    [
      "GET",
      /^\/api\/mentoring\/reviews$/,
      (route) =>
        this.mentorReviews(route, (m, youth) =>
          this.reviews.queue(route, m.organizationId, youth),
        ),
    ],
    [
      "GET",
      /^\/api\/mentoring\/submissions\/(?<id>[^/]+)$/,
      (route, p) =>
        this.mentorReviews(route, (m, youth) =>
          this.reviews.review(
            route,
            m.organizationId,
            youth,
            p["id"]!,
            m.personName,
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/mentoring\/submissions\/(?<id>[^/]+)\/file$/,
      (route, p) =>
        this.mentorReviews(route, (_m, youth) =>
          this.reviews.file(route, youth, p["id"]!),
        ),
    ],
    [
      "GET",
      /^\/api\/mentoring\/quiz-approvals$/,
      (route) =>
        this.mentorReviews(route, (m, youth) =>
          this.reviews.quizApprovals(route, m.organizationId, youth),
        ),
    ],
    [
      "POST",
      /^\/api\/mentoring\/quiz-approvals\/approve-all$/,
      (route) =>
        this.mentorReviews(route, (_m, youth) =>
          this.afterReview(youth, this.reviews.approveAll(route, youth)),
        ),
    ],
    [
      "POST",
      /^\/api\/mentoring\/quiz-attempts\/(?<id>[^/]+)\/approve$/,
      (route, p) =>
        this.mentorReviews(route, (_m, youth) =>
          this.afterReview(
            youth,
            this.reviews.approveQuiz(route, youth, p["id"]!),
          ),
        ),
    ],
    [
      "POST",
      /^\/api\/mentoring\/submissions\/(?<id>[^/]+)\/grade$/,
      (route, p) =>
        this.mentorReviews(route, (m, youth) =>
          this.afterReview(
            youth,
            this.reviews.grade(route, youth, p["id"]!, m.personName),
          ),
        ),
    ],
    [
      "GET",
      /^\/api\/mentoring\/check-ins$/,
      (route) => this.mentorCheckInHistory(route),
    ],
    [
      "POST",
      /^\/api\/mentoring\/check-ins$/,
      (route) => this.logMentorCheckIn(route),
    ],
    [
      "GET",
      /^\/api\/mentoring\/assign-work$/,
      (route) => this.assignWorkOptions(route),
    ],
    [
      "POST",
      /^\/api\/mentoring\/assigned-work$/,
      (route) => this.assignWork(route),
    ],
    [
      "GET",
      /^\/api\/mentoring\/flags$/,
      (route) => this.listAtRiskFlags(route),
    ],
    [
      "POST",
      /^\/api\/mentoring\/flags$/,
      (route) => this.raiseAtRiskFlag(route),
    ],
    [
      "POST",
      /^\/api\/mentoring\/flags\/(?<id>[^/]+)\/resolve$/,
      (route, p) => this.resolveAtRiskFlag(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/mentoring\/youth\/(?<id>[^/]+)$/,
      (route, p) => this.mentorYouthRecord(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/mentoring\/youth\/(?<id>[^/]+)\/reflections$/,
      (route, p) => this.mentorReflections(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/mentoring\/youth\/(?<id>[^/]+)\/competencies$/,
      (route, p) => this.mentorCompetencies(route, p["id"]!, false),
    ],
    [
      "PUT",
      /^\/api\/mentoring\/youth\/(?<id>[^/]+)\/competencies$/,
      (route, p) => this.mentorCompetencies(route, p["id"]!, true),
    ],
    [
      "GET",
      /^\/api\/mentoring\/cohorts\/(?<id>[^/]+)$/,
      (route, p) => this.mentorCohort(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/programs\/(?<id>[^/]+)\/mentoring$/,
      (route, p) => this.cohortMentoring(route, p["id"]!),
    ],
    [
      "PUT",
      /^\/api\/programs\/(?<id>[^/]+)\/mentors$/,
      (route, p) => this.setCohortMentors(route, p["id"]!),
    ],
    [
      "PUT",
      /^\/api\/programs\/(?<id>[^/]+)\/youth\/(?<child>[^/]+)\/mentor$/,
      (route, p) => this.assignYouthMentorRoute(route, p["id"]!, p["child"]!),
    ],
    [
      "DELETE",
      /^\/api\/programs\/(?<id>[^/]+)\/youth\/(?<child>[^/]+)\/mentor$/,
      (route, p) => this.removeYouthMentor(route, p["id"]!, p["child"]!),
    ],
    ["GET", /^\/api\/learning-bond$/, (route) => this.learningBondStatus(route)],
    ["GET", /^\/api\/learning-bond\/agreement$/, (route) => this.learningBondAgreement(route)],
    ["POST", /^\/api\/learning-bond\/agreement\/acceptances$/, (route) => this.learningBondAccept(route)],
    ["POST", /^\/api\/learning-bond\/agreement\/signers$/, (route) => this.learningBondRequestSigner(route)],
    ["GET", /^\/api\/learning-bond\/settings$/, (route) => this.learningBondSettings(route)],
    ["PUT", /^\/api\/learning-bond\/settings$/, (route) => this.learningBondSaveSettings(route)],
    ["GET", /^\/api\/learning-bond\/invitation$/, (route) => this.learningBondInvitation(route)],
    ["PUT", /^\/api\/learning-bond\/invitation$/, (route) => this.learningBondSaveInvitation(route)],
    ["GET", /^\/api\/learning-bond\/overview$/, (route) => this.learningBondOverview(route)],
    ["POST", /^\/api\/learning-bond\/agreement\/signers\/(?<id>[^/]+)\/resend$/, (route, p) => this.learningBondResendSigner(route, p["id"]!)],
    ["DELETE", /^\/api\/learning-bond\/agreement\/signers\/(?<id>[^/]+)$/, (route, p) => this.learningBondCancelSigner(route, p["id"]!)],
    ["GET", /^\/api\/sign\/learning-bond\/(?<token>[^/]+)$/, (route, p) => this.learningBond.signerAgreement(route, p["token"]!, (id) => this.organizationDetailsOf(id).name)],
    [
      "POST",
      /^\/api\/sign\/learning-bond\/(?<token>[^/]+)\/acceptances$/,
      (route, p) => this.learningBondAcceptAsSigner(route, p["token"]!),
    ],
    [
      "GET",
      /^\/api\/g\/learning-bond\/(?<token>[^/]+)$/,
      (route, p) => this.learningBondLink(route, p["token"]!),
    ],
    [
      "GET",
      /^\/api\/website\/(?<slug>[^/]+)$/,
      (route, p) => this.website(route, p["slug"]!),
    ],
    [
      "GET",
      /^\/api\/website\/(?<slug>[^/]+)\/content$/,
      (route, p) => this.websiteContent(route, p["slug"]!),
    ],
    [
      "POST",
      /^\/api\/website\/(?<slug>[^/]+)\/(?<kind>contact|volunteer|donations)$/,
      (route, p) => this.websiteRequest(route, p["slug"]!, p["kind"] as "contact" | "volunteer" | "donations"),
    ],
    ["POST", /^\/api\/auth\/sign-in$/, (route) => this.signIn(route)],
    ["POST", /^\/api\/auth\/mfa$/, (route) => this.mfa(route)],
    ["POST", /^\/api\/auth\/sign-out$/, (route) => this.signOut(route)],
    ["GET", /^\/api\/setup$/, (route) => this.setup(route)],
    [
      "POST",
      /^\/api\/auth\/forgot-password$/,
      (route) => this.forgotPassword(route),
    ],
    [
      "GET",
      /^\/api\/auth\/reset-password\/(?<token>[^/]+)$/,
      (route, p) => this.checkReset(route, p["token"]!),
    ],
    [
      "POST",
      /^\/api\/auth\/reset-password$/,
      (route) => this.resetPassword(route),
    ],
    ["GET", /^\/api\/me\/account$/, (route) => this.account(route)],
    ["PUT", /^\/api\/me\/profile$/, (route) => this.saveProfile(route)],
    ["POST", /^\/api\/me\/password$/, (route) => this.changePassword(route)],
    ["GET", /^\/api\/me\/display$/, (route) => this.getDisplay(route)],
    ["PUT", /^\/api\/me\/display$/, (route) => this.saveDisplay(route)],
    [
      "POST",
      /^\/api\/me\/recovery-codes$/,
      (route) => this.newRecoveryCodes(route),
    ],
    [
      "POST",
      /^\/api\/me\/sign-out-others$/,
      (route) => this.signOutOthers(route),
    ],
    ["GET", /^\/api\/billing$/, (route) => this.billing(route)],
    ["GET", /^\/api\/audit$/, (route) => this.auditLog(route)],
    [
      "GET",
      /^\/api\/platform\/organizations$/,
      (route) => this.platformOrganizations(route),
    ],
    [
      "POST",
      /^\/api\/platform\/organizations$/,
      (route) => this.addOrganization(route),
    ],
    [
      "POST",
      /^\/api\/platform\/organizations\/(?<id>[^/]+)\/suspend$/,
      (route, p) => this.suspendOrganization(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/platform\/organizations\/(?<id>[^/]+)\/reinstate$/,
      (route, p) => this.reinstateOrganization(route, p["id"]!),
    ],
    ["PUT", /^\/api\/billing\/plan$/, (route) => this.changePlan(route)],
    [
      "GET",
      /^\/api\/me\/organizations$/,
      (route) => this.myOrganizations(route),
    ],
    [
      "POST",
      /^\/api\/me\/organization$/,
      (route) => this.switchOrganization(route),
    ],
    [
      "GET",
      /^\/api\/settings\/organization$/,
      (route) => this.getOrganizationProfile(route),
    ],
    [
      "PUT",
      /^\/api\/settings\/organization$/,
      (route) => this.saveOrganizationProfile(route),
    ],
    [
      "POST",
      /^\/api\/settings\/organization\/logo$/,
      (route) => this.uploadOrganizationLogo(route),
    ],
    [
      "GET",
      /^\/api\/settings\/organization\/logo$/,
      (route) => this.organizationLogo(route),
    ],
    [
      "DELETE",
      /^\/api\/settings\/organization\/logo$/,
      (route) => this.removeOrganizationLogo(route),
    ],
    [
      "GET",
      /^\/api\/settings\/organization\/profile$/,
      (route) => this.getOrganizationDetails(route),
    ],
    [
      "PUT",
      /^\/api\/settings\/organization\/profile$/,
      (route) => this.saveOrganizationDetails(route),
    ],
    ["GET", /^\/api\/settings\/privacy$/, (route) => this.getPrivacy(route)],
    [
      "GET",
      /^\/api\/settings\/data-requests$/,
      (route) => this.listDataRequests(route),
    ],
    [
      "POST",
      /^\/api\/settings\/data-requests\/(?<id>[^/]+)\/fulfil$/,
      (route, p) => this.fulfilDataRequest(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/g\/home\/(?<token>[^/]+)\/data-requests$/,
      (route, p) => this.askForData(route, p["token"]!),
    ],
    ["PUT", /^\/api\/settings\/privacy$/, (route) => this.savePrivacy(route)],
    [
      "GET",
      /^\/api\/settings\/consent$/,
      (route) => this.getConsentPolicy(route),
    ],
    [
      "PUT",
      /^\/api\/settings\/consent$/,
      (route) => this.saveConsentPolicy(route),
    ],
    [
      "GET",
      /^\/api\/settings\/learning$/,
      (route) => this.getConsentPolicy(route, "Learning"),
    ],
    [
      "PUT",
      /^\/api\/settings\/learning$/,
      (route) => this.saveConsentPolicy(route, "Learning"),
    ],
    [
      "GET",
      /^\/api\/settings\/mentoring$/,
      (route) => this.getMentoringSettings(route),
    ],
    [
      "PUT",
      /^\/api\/settings\/mentoring$/,
      (route) => this.saveMentoringSettings(route),
    ],
    [
      "GET",
      /^\/api\/settings\/website$/,
      (route) => this.getWebsiteProfile(route),
    ],
    [
      "PUT",
      /^\/api\/settings\/website$/,
      (route) => this.saveWebsiteProfile(route),
    ],
    [
      "GET",
      /^\/api\/settings\/notifications$/,
      (route) => this.getNotificationSettings(route),
    ],
    [
      "PUT",
      /^\/api\/settings\/notifications$/,
      (route) => this.saveNotificationSettings(route),
    ],
    ["GET", /^\/api\/settings\/modules$/, (route) => this.getModules(route)],
    ["PUT", /^\/api\/settings\/modules$/, (route) => this.saveModules(route)],
    ["GET", /^\/api\/today$/, (route) => this.today(route)],
    ["GET", /^\/api\/search$/, (route) => this.search(route)],
    ["GET", /^\/api\/reports$/, (route) => this.report(route)],
    [
      "GET",
      /^\/api\/reports\/cohorts\/(?<id>[^/]+)$/,
      (route, p) => this.cohortReport(route, p["id"]!),
    ],
    ["GET", /^\/api\/reports\/staff$/, (route) => this.staffReport(route)],
    [
      "GET",
      /^\/api\/reports\/progress\/(?<id>[^/]+)$/,
      (route, p) => this.progressBoard(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/reports\/youth\/(?<id>[^/]+)$/,
      (route, p) => this.youthReport(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/events\/(?<id>[^/]+)\/survey$/,
      (route, p) => this.sendSurvey(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/g\/survey\/(?<token>[^/]+)$/,
      (route, p) => this.guardianSurvey(route, p["token"]!),
    ],
    [
      "POST",
      /^\/api\/g\/survey\/(?<token>[^/]+)$/,
      (route, p) => this.answerSurvey(route, p["token"]!),
    ],
    ["POST", /^\/api\/reports\/exports$/, (route) => this.exportReport(route)],
    [
      "GET",
      /^\/api\/reports\/exports\/(?<id>[^/]+)$/,
      (route, p) => this.downloadExport(route, p["id"]!),
    ],
    ["GET", /^\/api\/notifications$/, (route) => this.listNotifications(route)],
    [
      "GET",
      /^\/api\/notifications\/preferences$/,
      (route) => this.getNotificationPreferences(route),
    ],
    [
      "PUT",
      /^\/api\/notifications\/preferences$/,
      (route) => this.saveNotificationPreferences(route),
    ],
    [
      "POST",
      /^\/api\/notifications\/read-all$/,
      (route) => this.readAllNotifications(route),
    ],
    [
      "POST",
      /^\/api\/notifications\/(?<id>[^/]+)\/read$/,
      (route, p) => this.readNotification(route, p["id"]!),
    ],
    ["GET", /^\/api\/households$/, (route) => this.listHouseholds(route)],
    ["POST", /^\/api\/households$/, (route) => this.createHousehold(route)],
    [
      "GET",
      /^\/api\/households\/(?<id>[^/]+)$/,
      (route, p) => this.getHousehold(route, p["id"]!),
    ],
    [
      "DELETE",
      /^\/api\/households\/(?<id>[^/]+)$/,
      (route, p) => this.deleteHousehold(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/households\/(?<id>[^/]+)\/children$/,
      (route, p) => this.addChild(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/households\/(?<id>[^/]+)\/guardians$/,
      (route, p) => this.addGuardian(route, p["id"]!),
    ],
    [
      "PUT",
      /^\/api\/guardians\/(?<id>[^/]+)$/,
      (route, p) => this.updateGuardian(route, p["id"]!),
    ],
    ["GET", /^\/api\/children$/, (route) => this.findChildren(route)],
    ["GET", /^\/api\/programs$/, (route) => this.listPrograms(route)],
    ["POST", /^\/api\/programs$/, (route) => this.saveProgram(route, null)],
    [
      "GET",
      /^\/api\/programs\/(?<id>[^/]+)$/,
      (route, p) => this.getProgram(route, p["id"]!),
    ],
    [
      "PUT",
      /^\/api\/programs\/(?<id>[^/]+)$/,
      (route, p) => this.saveProgram(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/programs\/(?<id>[^/]+)\/archive$/,
      (route, p) => this.archiveProgram(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/programs\/(?<id>[^/]+)\/restore$/,
      (route, p) => this.restoreProgram(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/programs\/(?<id>[^/]+)\/enrollments$/,
      (route, p) => this.enroll(route, p["id"]!),
    ],
    [
      "DELETE",
      /^\/api\/programs\/(?<id>[^/]+)\/enrollments\/(?<child>[^/]+)$/,
      (route, p) => this.unenroll(route, p["id"]!, p["child"]!),
    ],
    ["GET", /^\/api\/events$/, (route) => this.listEvents(route)],
    ["GET", /^\/api\/events\/calendar$/, (route) => this.eventCalendar(route)],
    ["GET", /^\/api\/schedule$/, (route) => this.youthSchedule(route)],
    [
      "PUT",
      /^\/api\/schedule\/(?<id>[^/]+)\/rsvp$/,
      (route, p) => this.rsvp(route, p["id"]!),
    ],
    ["POST", /^\/api\/events$/, (route) => this.saveEvent(route, null)],
    [
      "GET",
      /^\/api\/events\/(?<id>[^/]+)$/,
      (route, p) => this.getEvent(route, p["id"]!),
    ],
    [
      "PUT",
      /^\/api\/events\/(?<id>[^/]+)$/,
      (route, p) => this.saveEvent(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/events\/(?<id>[^/]+)\/cancel$/,
      (route, p) => this.cancelEvent(route, p["id"]!),
    ],
    ["GET", /^\/api\/sessions\/today$/, (route) => this.todaySessions(route)],
    ["GET", /^\/api\/sessions\/mine$/, (route) => this.mySchedule(route)],
    ["GET", /^\/api\/attendance$/, (route) => this.attendanceHistory(route)],
    [
      "PUT",
      /^\/api\/sessions\/(?<id>[^/]+)\/attendance\/(?<childId>[^/]+)$/,
      (route, p) => this.correctAttendance(route, p["id"]!, p["childId"]!),
    ],
    [
      "GET",
      /^\/api\/sessions\/(?<id>[^/]+)\/roster$/,
      (route, p) => this.sessionRoster(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/sessions\/(?<id>[^/]+)\/check-ins$/,
      (route, p) => this.attend(route, p["id"]!, "Present"),
    ],
    [
      "POST",
      /^\/api\/sessions\/(?<id>[^/]+)\/absences$/,
      (route, p) => this.attend(route, p["id"]!, "Absent"),
    ],
    [
      "POST",
      /^\/api\/sessions\/(?<id>[^/]+)\/walk-ins$/,
      (route, p) => this.addWalkIn(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/sessions\/(?<id>[^/]+)\/end$/,
      (route, p) => this.endSession(route, p["id"]!),
    ],
    [
      "PUT",
      /^\/api\/sessions\/(?<id>[^/]+)\/notes$/,
      (route, p) => this.sessionNotes(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/sessions\/(?<id>[^/]+)\/sign-outs$/,
      (route, p) => this.signChildOut(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/children\/(?<id>[^/]+)\/pickups$/,
      (route, p) => this.pickups(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/children\/(?<id>[^/]+)\/pickups$/,
      (route, p) => this.addPickup(route, p["id"]!),
    ],
    ["GET", /^\/api\/staff$/, (route) => this.listStaff(route)],
    ["GET", /^\/api\/people$/, (route) => this.listPeople(route)],
    [
      "GET",
      /^\/api\/people\/(?<id>[^/]+)$/,
      (route, p) => this.getPerson(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/people\/(?<id>[^/]+)\/deactivate$/,
      (route, p) => this.deactivatePersonRoute(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/people\/(?<id>[^/]+)\/reactivate$/,
      (route, p) => this.reactivatePersonRoute(route, p["id"]!),
    ],
    ["GET", /^\/api\/coverage$/, (route) => this.coverage(route)],
    [
      "PUT",
      /^\/api\/sessions\/(?<id>[^/]+)\/staff$/,
      (route, p) => this.assignStaff(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/invitations\/(?<token>[^/]+)$/,
      (route, p) => this.getInvitation(route, p["token"]!),
    ],
    [
      "POST",
      /^\/api\/invitations\/(?<token>[^/]+)\/accept$/,
      (route, p) => this.acceptInvitation(route, p["token"]!),
    ],
    [
      "POST",
      /^\/api\/invitations\/(?<token>[^/]+)\/request-new$/,
      (route, p) => this.requestNewLink(route, p["token"]!),
    ],
    ["PUT", /^\/api\/me\/phone$/, (route) => this.savePhone(route)],
    ["POST", /^\/api\/staff\/invitations$/, (route) => this.inviteStaff(route)],
    [
      "DELETE",
      /^\/api\/staff\/invitations\/(?<id>[^/]+)$/,
      (route, p) => this.withdrawInvitation(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/staff\/invitations\/(?<id>[^/]+)\/resend$/,
      (route, p) => this.resendInvitation(route, p["id"]!),
    ],
    [
      "PUT",
      /^\/api\/staff\/(?<id>[^/]+)\/role$/,
      (route, p) => this.changeRole(route, p["id"]!),
    ],
    [
      "DELETE",
      /^\/api\/staff\/(?<id>[^/]+)$/,
      (route, p) => this.removeStaff(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/sessions\/(?<id>[^/]+)\/pickup-requests$/,
      (route, p) => this.askForPickup(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/pickup-requests\/(?<id>[^/]+)$/,
      (route, p) => this.pickupRequest(route, p["id"]!),
    ],
    [
      "PUT",
      /^\/api\/g\/home\/(?<token>[^/]+)\/household$/,
      (route, p) => this.guardianUpdateHousehold(route, p["token"]!),
    ],
    [
      "PUT",
      /^\/api\/g\/home\/(?<token>[^/]+)\/children\/(?<id>[^/]+)\/medical$/,
      (route, p) => this.guardianUpdateMedical(route, p["token"]!, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/g\/home\/(?<token>[^/]+)\/pickup-requests\/(?<id>[^/]+)$/,
      (route, p) => this.guardianDecidesPickup(route, p["token"]!, p["id"]!),
    ],
    [
      "DELETE",
      /^\/api\/children\/(?<id>[^/]+)\/pickups\/(?<pickup>[^/]+)$/,
      (route, p) => this.removePickup(route, p["id"]!, p["pickup"]!),
    ],
    [
      "POST",
      /^\/api\/g\/home\/(?<token>[^/]+)\/children\/(?<id>[^/]+)\/pickups$/,
      (route, p) => this.guardianAddPickup(route, p["token"]!, p["id"]!),
    ],
    [
      "DELETE",
      /^\/api\/g\/home\/(?<token>[^/]+)\/children\/(?<id>[^/]+)\/pickups\/(?<pickup>[^/]+)$/,
      (route, p) =>
        this.guardianRemovePickup(route, p["token"]!, p["id"]!, p["pickup"]!),
    ],
    [
      "GET",
      /^\/api\/programs\/(?<id>[^/]+)\/enrollments$/,
      (route, p) => this.listEnrollmentRequests(route, p["id"]!),
    ],
    ["GET", /^\/api\/applications$/, (route) => this.listApplications(route)],
    [
      "GET",
      /^\/api\/applications\/(?<id>[^/]+)$/,
      (route, p) => this.getApplication(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/applications\/(?<id>[^/]+)\/notes$/,
      (route, p) => this.addApplicationNote(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/applications\/(?<id>[^/]+)\/place$/,
      (route, p) => this.placeApplication(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/enrollments\/review$/,
      (route) => this.reviewEnrollments(route, null),
    ],
    [
      "POST",
      /^\/api\/enrollments\/(?<id>[^/]+)\/review$/,
      (route, p) => this.reviewEnrollments(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/programs\/(?<id>[^/]+)\/enrollment\/open$/,
      (route, p) => this.openEnrollmentRoute(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/programs\/(?<id>[^/]+)\/enrollment\/close$/,
      (route, p) => this.closeEnrollmentRoute(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/g\/enroll\/(?<slug>[^/]+)$/,
      (route, p) => this.enrollPage(route, p["slug"]!),
    ],
    [
      "POST",
      /^\/api\/g\/enroll\/(?<slug>[^/]+)\/code$/,
      (route, p) => this.enrollCode(route, p["slug"]!),
    ],
    [
      "POST",
      /^\/api\/g\/enroll\/(?<slug>[^/]+)\/verify$/,
      (route, p) => this.enrollVerify(route, p["slug"]!),
    ],
    [
      "GET",
      /^\/api\/g\/enroll\/(?<slug>[^/]+)\/draft$/,
      (route, p) => this.enrollDraft(route, p["slug"]!),
    ],
    [
      "PUT",
      /^\/api\/g\/enroll\/(?<slug>[^/]+)\/draft$/,
      (route, p) => this.enrollSave(route, p["slug"]!),
    ],
    [
      "POST",
      /^\/api\/g\/enroll\/(?<slug>[^/]+)\/submit$/,
      (route, p) => this.enrollSubmit(route, p["slug"]!),
    ],
    ["POST", /^\/api\/imports$/, (route) => this.uploadImport(route)],
    [
      "PUT",
      /^\/api\/imports\/(?<id>[^/]+)\/mapping$/,
      (route, p) => this.mapImport(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/imports\/(?<id>[^/]+)\/run$/,
      (route, p) => this.runImport(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/g\/auth\/code$/,
      (route) => this.guardianCodeRoute(route),
    ],
    ["POST", /^\/api\/g\/auth\/verify$/, (route) => this.guardianVerify(route)],
    ["GET", /^\/api\/incidents$/, (route) => this.listIncidents(route)],
    ["GET", /^\/api\/incidents\/form$/, (route) => this.incidentForm(route)],
    [
      "GET",
      /^\/api\/incidents\/(?<id>[^/]+)$/,
      (route, p) => this.getIncident(route, p["id"]!),
    ],
    ["POST", /^\/api\/incidents$/, (route) => this.createIncident(route)],
    [
      "POST",
      /^\/api\/incidents\/(?<id>[^/]+)\/review$/,
      (route, p) => this.reviewIncident(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/incidents\/(?<id>[^/]+)\/reopen$/,
      (route, p) => this.reopenIncident(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/incidents\/(?<id>[^/]+)\/notes$/,
      (route, p) => this.addIncidentNote(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/g\/home\/(?<token>[^/]+)$/,
      (route, p) => this.guardianHome(route, p["token"]!),
    ],
    [
      "GET",
      /^\/api\/g\/home\/(?<token>[^/]+)\/announcements$/,
      (route, p) => this.guardianAnnouncements(route, p["token"]!),
    ],
    [
      "POST",
      /^\/api\/g\/home\/(?<token>[^/]+)\/announcements\/read$/,
      (route, p) => this.markAnnouncementsRead(route, p["token"]!),
    ],
    [
      "GET",
      /^\/api\/g\/home\/(?<token>[^/]+)\/children\/(?<child>[^/]+)$/,
      (route, p) => this.guardianChild(route, p["token"]!, p["child"]!),
    ],
    [
      "POST",
      /^\/api\/g\/home\/(?<token>[^/]+)\/no-show$/,
      (route, p) => this.answerNoShow(route, p["token"]!),
    ],
    [
      "GET",
      /^\/api\/g\/slips\/(?<token>[^/]+)$/,
      (route, p) => this.guardianSlip(route, p["token"]!),
    ],
    [
      "POST",
      /^\/api\/g\/slips\/(?<token>[^/]+)\/sign$/,
      (route, p) => this.guardianAnswer(route, p["token"]!, "Signed"),
    ],
    [
      "POST",
      /^\/api\/g\/slips\/(?<token>[^/]+)\/decline$/,
      (route, p) => this.guardianAnswer(route, p["token"]!, "Declined"),
    ],
    [
      "GET",
      /^\/api\/sessions\/(?<id>[^/]+)\/clearance$/,
      (route, p) => this.clearance(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/slips\/(?<id>[^/]+)\/unsigned$/,
      (route, p) => this.unsignedFamilies(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/slips\/(?<id>[^/]+)\/remind$/,
      (route, p) => this.remindNow(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/slips\/(?<id>[^/]+)\/sign-on-tablet$/,
      (route, p) => this.signOnTablet(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/events\/(?<id>[^/]+)\/slip$/,
      (route, p) => this.getSlip(route, p["id"]!),
    ],
    [
      "PUT",
      /^\/api\/events\/(?<id>[^/]+)\/slip$/,
      (route, p) => this.saveSlip(route, p["id"]!),
    ],
    ["GET", /^\/api\/slips$/, (route) => this.listSlips(route)],
    [
      "POST",
      /^\/api\/slips\/(?<id>[^/]+)\/send$/,
      (route, p) => this.sendSlipRoute(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/slips\/(?<id>[^/]+)\/send-now$/,
      (route, p) => this.slipTransition(route, p["id"]!, "send-now"),
    ],
    [
      "POST",
      /^\/api\/slips\/(?<id>[^/]+)\/cancel-send$/,
      (route, p) => this.slipTransition(route, p["id"]!, "cancel"),
    ],
    [
      "PUT",
      /^\/api\/slips\/(?<id>[^/]+)$/,
      (route, p) => this.editSlip(route, p["id"]!),
    ],
    ["GET", /^\/api\/realtime$/, (route) => this.realtime(route)],
    ["GET", /^\/api\/conversations$/, (route) => this.listConversations(route)],
    [
      "GET",
      /^\/api\/conversations\/(?<id>[^/]+)$/,
      (route, p) => this.getConversation(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/conversations\/(?<id>[^/]+)\/messages$/,
      (route, p) => this.sendDirectMessage(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/announcements\/mine$/,
      (route) => this.myAnnouncements(route),
    ],
    [
      "POST",
      /^\/api\/announcements\/mine\/read$/,
      (route) => this.readMyAnnouncements(route),
    ],
    ["GET", /^\/api\/announcements$/, (route) => this.listAnnouncements(route)],
    [
      "POST",
      /^\/api\/announcements$/,
      (route) => this.composeAnnouncement(route),
    ],
    ["GET", /^\/api\/messages$/, (route) => this.listMessages(route)],
    [
      "POST",
      /^\/api\/messages\/preview$/,
      (route) => this.previewMessage(route),
    ],
    ["POST", /^\/api\/messages$/, (route) => this.sendMessage(route)],
    [
      "GET",
      /^\/api\/messages\/(?<id>[^/]+)$/,
      (route, p) => this.getMessage(route, p["id"]!),
    ],
    ["GET", /^\/api\/messaging\/sms-cap$/, (route) => this.smsCap(route)],
    [
      "GET",
      /^\/api\/children\/(?<id>[^/]+)\/quick-card$/,
      (route, p) => this.quickCard(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/children\/(?<id>[^/]+)\/youth-account$/,
      (route, p) => this.youthAccount(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/children\/(?<id>[^/]+)\/consent$/,
      (route, p) => this.childConsent(route, p["id"]!),
    ],
    [
      "POST",
      /^\/api\/children\/(?<id>[^/]+)\/consent-request$/,
      (route, p) => this.sendConsentLink(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/g\/consent\/(?<token>[^/]+)$/,
      (route, p) => this.guardianConsent(route, p["token"]!),
    ],
    [
      "POST",
      /^\/api\/g\/consent\/(?<token>[^/]+)\/sign$/,
      (route, p) => this.giveConsentRoute(route, p["token"]!),
    ],
    [
      "POST",
      /^\/api\/g\/consent\/(?<token>[^/]+)\/withdraw$/,
      (route, p) => this.withdrawConsentRoute(route, p["token"]!),
    ],
    [
      "POST",
      /^\/api\/children\/(?<id>[^/]+)\/youth-invitation$/,
      (route, p) => this.inviteYouth(route, p["id"]!),
    ],
    [
      "GET",
      /^\/api\/children\/(?<id>[^/]+)$/,
      (route, p) => this.getChild(route, p["id"]!),
    ],
    [
      "PUT",
      /^\/api\/children\/(?<id>[^/]+)$/,
      (route, p) => this.updateChild(route, p["id"]!),
    ],
    [
      "PUT",
      /^\/api\/children\/(?<id>[^/]+)\/medical$/,
      (route, p) => this.updateMedical(route, p["id"]!),
    ],
  ];

  /** Staff changes in this test: roles changed, access removed and invitations sent (seeded memberships stay as they are). */
  private roleOverrides = new Map<string, string>();
  private invitationLinks = new Map<
    string,
    {
      email: string;
      role: string;
      expired: boolean;
      accepted: boolean;
      withdrawn?: boolean;
      childId: string | null;
      suggestedName: string | null;
    }
  >();
  private removedMembers = new Set<string>();
  private invitations: {
    id: string;
    organizationId: string;
    email: string;
    role: string;
    invitedBy: string;
    withdrawn: boolean;
    childId?: string;
    childName?: string;
    expired?: boolean;
    replacementRequested?: boolean;
  }[] = [];
  /** Expired links whose holder asked for a new one in this test (L2-054). */
  newLinkRequests: string[] = [];
  /** Emails whose invitation was resent in this test, in order. */
  resentInvitations: string[] = [];
  /** Staff asked a guardian about an adult not on the approved list. */
  private pickupRequests: {
    id: string;
    eventId: string;
    childId: string;
    householdId: string;
    collector: string;
    status: "Pending" | "Approved" | "Refused";
    decidedBy: string | null;
  }[] = [];
  /** Approved adults besides the guardians, as added by staff or the family. */
  private extraPickups: {
    id: string;
    childId: string;
    householdId: string;
    name: string;
    relationship: string;
    removed: boolean;
  }[] = [];
  /** While true, every API call fails as if the device had no signal (the app shell stays loaded). */
  private offline = false;
  /** Children whose offline check-in arrived after another device marked them absent: "event:child". */
  private conflicts = new Set<string>();

  setOffline(offline: boolean): void {
    this.offline = offline;
  }

  /** An offline check-in reached the server after another device marked the child absent; present wins and the row is flagged. */
  attendanceConflict(eventId: string, childId: string): void {
    this.conflicts.add(`${eventId}:${childId}`);
    this.sessionRecords(eventId).set(childId, {
      status: "Present",
      checkedInAt: "2026-11-05T21:05:00Z",
    });
  }

  /** Whether the fake recorded this child as checked in at this session (to check a synced action). */
  attendanceOf(eventId: string, childId: string): string {
    return this.sessionRecords(eventId).get(childId)?.status ?? "NotYet";
  }

  /** The fake's attendance record of this child at this session, with its late and excused flags (L2-095). */
  attendanceRecord(
    eventId: string,
    childId: string,
  ): FakeAttendance | undefined {
    return this.sessionRecords(eventId).get(childId);
  }

  private async handle(route: Route): Promise<void> {
    if (this.offline) return route.abort("internetdisconnected");
    const url = new URL(route.request().url());
    const failure = this.failures.get(url.pathname);
    if (failure) {
      // A fault answers as the API's ExceptionHandlingMiddleware does: a code and a reference to quote (L2-041).
      return route.fulfill(
        failure >= 500
          ? {
              status: failure,
              json: { code: "server-error", reference: FAULT_REFERENCE },
            }
          : { status: failure },
      );
    }
    // A removed membership continues in the person's next one, or the account is inactive (L2-002, L2-050).
    const current = memberships.find((x) => x.id === this.membershipId);
    if (current && this.removedMemberships.has(current.id)) {
      const next = memberships.find(
        (x) => x.email === current.email && !this.removedMemberships.has(x.id),
      );
      // Like the cookie, the session stays and every request answers the same until someone signs in again.
      if (!next && !url.pathname.startsWith("/api/auth"))
        return route.fulfill({
          status: 401,
          json: { code: "account-deactivated" },
        });
      if (next) this.membershipId = next.id;
    }
    // A suspended organization is closed to its staff; platform administration stays open (L2-003).
    const caller = memberships.find((x) => x.id === this.membershipId);
    if (
      caller &&
      this.suspended.has(caller.organizationId) &&
      !url.pathname.startsWith("/api/platform") &&
      !url.pathname.startsWith("/api/auth")
    ) {
      return route.fulfill({ status: 403, json: { code: "suspended" } });
    }
    if (
      caller &&
      !can.useStaffApp(caller) &&
      !url.pathname.startsWith("/api/website/")
    ) {
      const allowed =
        PARTICIPANT_PATHS.some((p) => p.test(url.pathname)) ||
        (can.runSessions(caller) &&
          RUNNER_PATHS.some((p) => p.test(url.pathname)));
      if (!allowed)
        return route.fulfill({ status: 403, json: { code: "forbidden" } });
    }
    for (const [method, pattern, handler] of this.routes) {
      const match = pattern.exec(url.pathname);
      if (match && route.request().method() === method) {
        return handler(route, match.groups ?? {});
      }
    }
    return this.reject(route);
  }

  /** GET /learning-bond: signed in, and 404 while Learning Bond is off for the caller's organization (L2-162 criterion 7). */
  private learningBondStatus(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    if (!this.modules.get(m.organizationId)!.includes("LearningBond"))
      return route.fulfill({ status: 404 });
    return route.fulfill({ json: { on: true } });
  }

  /**
   * The caller of a Learning Bond agreement route: ManageSettings with Roster and Messages on, whether or not Learning Bond is (ADR 0077).
   * Otherwise answers 401, 403 or 404.
   */
  private async learningBondAgreementCaller(route: Route): Promise<Membership | null> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      await this.unauthenticated(route);
      return null;
    }
    if (!can.manageSettings(m)) {
      await route.fulfill({ status: 403, json: { code: "forbidden" } });
      return null;
    }
    const on = this.modules.get(m.organizationId)!;
    if (!on.includes("Roster") || !on.includes("Messages")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return m;
  }

  /** GET /learning-bond/agreement (L2-136 criterion 1). */
  private async learningBondAgreement(route: Route): Promise<void> {
    const m = await this.learningBondAgreementCaller(route);
    if (!m) return;
    return this.learningBond.agreement(route, m, this.modules.get(m.organizationId)!.includes("LearningBond"), this.organizationDetailsOf(m.organizationId).name);
  }

  /** POST /learning-bond/agreement/acceptances (L2-136 criteria 2 and 3). */
  private async learningBondAccept(route: Route): Promise<void> {
    const m = await this.learningBondAgreementCaller(route);
    if (!m) return;
    return this.learningBond.accept(route, m, "2026-11-05T21:12:00Z");
  }

  /** The caller of a gated Learning Bond settings route: ManageSettings (checked first, as the API authorizes before the module gate) with Learning Bond on; otherwise 401, 403 or 404. */
  private async learningBondAdmin(route: Route): Promise<Membership | null> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      await this.unauthenticated(route);
      return null;
    }
    if (!can.manageSettings(m)) {
      await route.fulfill({ status: 403, json: { code: "forbidden" } });
      return null;
    }
    if (!this.modules.get(m.organizationId)!.includes("LearningBond")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return m;
  }

  /** The organization's running programs and the households each reaches through children on its roster (LearningBondCoverage). */
  private learningBondPrograms(organizationId: string): FakeLearningBondProgram[] {
    const householdOf = new Map(this.households.flatMap((h) => h.children.map((c) => [c.id, h.id] as const)));
    return this.programs
      .filter((p) => p.organizationId === organizationId && p.status === "Active")
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({
        id: p.id,
        name: p.name,
        households: [...new Set(p.roster.map((c) => householdOf.get(c)).filter((h): h is string => !!h))],
      }));
  }

  /** GET /learning-bond/settings (L2-138 criterion 1). */
  private async learningBondSettings(route: Route): Promise<void> {
    const m = await this.learningBondAdmin(route);
    if (!m) return;
    return this.learningBond.getSettings(route, m, this.learningBondPrograms(m.organizationId));
  }

  /** PUT /learning-bond/settings (L2-138 criteria 2 to 4). */
  private async learningBondSaveSettings(route: Route): Promise<void> {
    const m = await this.learningBondAdmin(route);
    if (!m) return;
    return this.learningBond.saveSettings(route, m, this.learningBondPrograms(m.organizationId));
  }

  /** The languages the organization's households use, as codes in English, Spanish, French order; English when there are none. */
  private learningBondLanguages(organizationId: string): string[] {
    const code = (language: string) => (language === "Spanish" ? "es" : language === "French" ? "fr" : "en");
    const used = new Set(this.households.filter((h) => h.organizationId === organizationId).map((h) => code(h.language)));
    const codes = ["en", "es", "fr"].filter((c) => used.has(c));
    return codes.length ? codes : ["en"];
  }

  /** GET /learning-bond/invitation (L2-139 criterion 1). */
  private async learningBondInvitation(route: Route): Promise<void> {
    const m = await this.learningBondAdmin(route);
    if (!m) return;
    const details = this.organizationDetailsOf(m.organizationId);
    return this.learningBond.invitation(route, m, { name: details.name, city: details.city }, this.learningBondLanguages(m.organizationId));
  }

  /** PUT /learning-bond/invitation (L2-139 criteria 2 and 3). */
  private async learningBondSaveInvitation(route: Route): Promise<void> {
    const m = await this.learningBondAdmin(route);
    if (!m) return;
    return this.learningBond.saveInvitation(route, m);
  }

  /** GET /learning-bond/overview (L2-136 criteria 4 and 9). */
  private async learningBondOverview(route: Route): Promise<void> {
    const m = await this.learningBondAdmin(route);
    if (!m) return;
    return this.learningBond.overview(
      route,
      m,
      this.organizationDetailsOf(m.organizationId).name,
      this.learningBondPrograms(m.organizationId),
      this.learningBondLanguages(m.organizationId),
    );
  }

  /** POST /learning-bond/agreement/signers (L2-137 criterion 1). */
  private async learningBondRequestSigner(route: Route): Promise<void> {
    const m = await this.learningBondAgreementCaller(route);
    if (!m) return;
    return this.learningBond.requestSigner(route, m, this.organizationDetailsOf(m.organizationId).name, "2026-11-05T21:12:00Z");
  }

  /** POST /learning-bond/agreement/signers/{id}/resend (L2-137 criterion 6). */
  private async learningBondResendSigner(route: Route, id: string): Promise<void> {
    const m = await this.learningBondAgreementCaller(route);
    if (!m) return;
    return this.learningBond.resendSigner(route, m, id, this.organizationDetailsOf(m.organizationId).name, "2026-11-05T21:14:00Z");
  }

  /** DELETE /learning-bond/agreement/signers/{id} (L2-137 criterion 6). */
  private async learningBondCancelSigner(route: Route, id: string): Promise<void> {
    const m = await this.learningBondAgreementCaller(route);
    if (!m) return;
    return this.learningBond.cancelSigner(route, m, id);
  }

  /** POST /sign/learning-bond/{token}/acceptances (L2-137 criterion 2): anonymous; the requesting admin is told in the app and by email. */
  private learningBondAcceptAsSigner(route: Route, token: string): Promise<void> {
    return this.learningBond.acceptAsSigner(route, token, (id) => this.organizationDetailsOf(id).name, "2026-11-05T21:30:00Z", (organizationId, membershipId, text) =>
      this.notify(organizationId, [membershipId], "agreement", text, "/settings/learning-bond/agreement"),
    );
  }

  /** GET /g/learning-bond/{token}: the organization from the link, then the module gate; every refusal is the same bare 404 (L2-162 criterion 6). */
  private learningBondLink(route: Route, token: string): Promise<void> {
    const link = this.learningBond.links.get(token);
    if (!link || !this.modules.get(link.organizationId)!.includes("LearningBond"))
      return route.fulfill({ status: 404 });
    const organization = organizations.find((o) => o.id === link.organizationId)!;
    return route.fulfill({ json: { organization: organization.name, language: link.language } });
  }

  private unauthenticated(route: Route): Promise<void> {
    return route.fulfill({
      status: 401,
      json: { code: this.expired ? "session-expired" : "unauthenticated" },
    });
  }

  private async me(route: Route): Promise<void> {
    const membership = memberships.find((m) => m.id === this.membershipId);
    if (!membership) {
      return this.unauthenticated(route);
    }
    const organization = organizations.find(
      (o) => o.id === membership.organizationId,
    )!;
    return route.fulfill({
      json: {
        personName: this.profileOf(membership.id).name,
        role: membership.role,
        organizationId: organization.id,
        organizationName: this.organizationDetailsOf(organization.id).name,
        plan: organization.plan,
        modules: this.modules.get(organization.id),
        membershipId: membership.id,
        display: this.displayOf(membership.email),
      },
    });
  }

  /** The caller when signed in, their module is on and their role holds the permission; otherwise answers 401, 404 or 403. */
  private async participantModuleCaller(
    route: Route,
    module: ModuleId,
    allowed: (m: Membership) => boolean,
  ): Promise<Membership | null> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      await this.unauthenticated(route);
      return null;
    }
    if (!allowed(m)) {
      await route.fulfill({ status: 403, json: { code: "forbidden" } });
      return null;
    }
    if (!this.modules.get(m.organizationId)!.includes(module)) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return m;
  }

  /** GET /learning/me: the youth's own linked child only (L2-007 criterion 9, L2-045). */
  private async learner(route: Route): Promise<void> {
    const m = await this.participantModuleCaller(route, "Learning", can.learn);
    if (!m) return;
    const linked = this.youthLinks.get(m.id);
    const found = linked
      ? this.households.flatMap((h) => h.children).find((c) => c.id === linked)
      : undefined;
    return route.fulfill({
      json: {
        personName: m.personName,
        child: found
          ? {
              id: found.id,
              firstName: found.firstName,
              lastName: found.lastName,
              age: ageOf(found.dateOfBirth),
            }
          : null,
      },
    });
  }

  /**
   * Every youth-work endpoint (L2-068 to L2-070): refused with 403 consent-required until a guardian consents (L2-056, L2-057),
   * then no-cohort until placed (L2-060); the handler gets the programs the youth is placed in.
   */
  private async youthWork(
    route: Route,
    handle: (m: Membership, programs: FakeProgram[]) => Promise<void>,
  ): Promise<void> {
    const m = await this.consentedYouth(route);
    if (!m) return;
    const programs = this.placementsOf(m);
    if (!programs.length)
      return route.fulfill({ status: 403, json: { code: "no-cohort" } });
    return handle(m, programs);
  }

  /** GET /learning/assignments/{id}: the brief with her mentor's name. */
  private assignmentBrief(
    route: Route,
    m: Membership,
    programs: FakeProgram[],
    id: string,
  ): Promise<void> {
    const place = this.learningState.assignmentPlace(m.id, programs, id);
    return this.learningState.work.brief(
      route,
      m.id,
      place,
      place ? this.youthMentorName(m, place.trackId) : null,
    );
  }

  /** GET /learning/lessons/{id}/reflection: the lesson she can see, with her mentor's name (L2-089 criterion 1). */
  private reflectionEditor(
    route: Route,
    m: Membership,
    programs: FakeProgram[],
    id: string,
  ): Promise<void> {
    const found = this.learningState.findLesson(
      this.learningState.tracks(m.id, programs),
      id,
    );
    return this.reflectionsState.editor(
      route,
      m.id,
      found,
      found ? this.youthMentorName(m, found.track.track.id) : null,
    );
  }

  /** Her child's marked attendance, or null while Roll Call is off (L2-088 criteria 3 and 4). */
  private youthAttendance(
    m: Membership,
  ):
    | { eventId: string; name: string; startsAt: string; status: string }[]
    | null {
    if (!this.modules.get(m.organizationId)!.includes("RollCall")) return null;
    const childId = this.youthLinks.get(m.id);
    if (!childId) return [];
    return this.events
      .filter((e) => e.organizationId === m.organizationId)
      .flatMap((e) => {
        const r = this.attendance.get(e.id)?.get(childId);
        return r && r.status !== "NotYet"
          ? [
              {
                eventId: e.id,
                name: e.name,
                startsAt: e.startsAt,
                status: r.status === "Absent" ? "Absent" : "Present",
              },
            ]
          : [];
      });
  }

  /** The youth's mentor (ADR 0056): her own, else the lead mentor of a program of hers that follows the track. */
  private youthMentorName(m: Membership, trackId: string): string | null {
    const childId = this.youthLinks.get(m.id);
    if (!childId) return null;
    const mentors = this.activeMentors(m.organizationId);
    const leads = this.placementsOf(m)
      .filter((p) => this.curriculumState.programTracks.get(p.id) === trackId)
      .map((p) => this.cohortMentors.get(p.id)?.lead);
    for (const id of [this.youthMentors.get(childId), ...leads]) {
      const found = mentors.find((x) => x.id === id);
      if (found) return found.name;
    }
    return null;
  }

  /** Every active program of the youth's organization with their child on the roster. */
  private placementsOf(m: Membership): FakeProgram[] {
    const childId = this.youthLinks.get(m.id);
    if (!childId) return [];
    return this.programs.filter(
      (p) =>
        p.organizationId === m.organizationId &&
        p.status === "Active" &&
        p.roster.includes(childId),
    );
  }

  /** The caller for a Learning endpoint that a youth without consent in force is refused (L2-056); null when answered already. */
  private async consentedYouth(route: Route): Promise<Membership | null> {
    const m = await this.participantModuleCaller(route, "Learning", can.learn);
    if (!m) return null;
    const childId = this.youthLinks.get(m.id);
    if (
      childId &&
      this.consentRequired(m.organizationId, childId) &&
      this.consentStatusName(childId) !== "Given"
    ) {
      await route.fulfill({
        status: 403,
        json: {
          code: "consent-required",
          consentAge: this.consentPolicyOf(m.organizationId).consentAge,
        },
      });
      return null;
    }
    return m;
  }

  /** The program a youth is placed in: their child on the roster of an active program of their organization (L2-060, ADR 0047). */
  private placementOf(m: Membership): FakeProgram | undefined {
    const childId = this.youthLinks.get(m.id);
    if (!childId) return undefined;
    return this.programs
      .filter(
        (p) =>
          p.organizationId === m.organizationId &&
          p.status === "Active" &&
          p.roster.includes(childId),
      )
      .sort((a, b) => a.startsOn.localeCompare(b.startsOn))[0];
  }

  /** GET /learning/onboarding: the caller's own setup, or its defaults, and their program (L2-059). */
  private async onboarding(route: Route): Promise<void> {
    const m = await this.consentedYouth(route);
    if (!m) return;
    const program = this.placementOf(m);
    const childId = this.youthLinks.get(m.id);
    const child = childId
      ? this.households.flatMap((h) => h.children).find((c) => c.id === childId)
      : undefined;
    const saved = this.onboardings.get(m.id);
    return route.fulfill({
      json: {
        status: saved
          ? saved.completed
            ? "completed"
            : "in-progress"
          : "not-started",
        step: saved?.step ?? 1,
        preferredName:
          saved?.preferredName ??
          child?.firstName ??
          m.personName.split(" ")[0],
        pronouns: saved?.pronouns ?? null,
        lessonReminders: saved?.lessonReminders ?? true,
        mentorMessages: saved?.mentorMessages ?? true,
        announcements: saved?.announcements ?? false,
        program: program
          ? {
              name: program.name,
              schedule: program.schedule,
              startsOn: program.startsOn,
              endsOn: program.endsOn,
            }
          : null,
      },
    });
  }

  /** PUT /learning/onboarding: validates and saves one step (L2-059 criterion 2). */
  private async saveOnboardingStep(route: Route): Promise<void> {
    const m = await this.consentedYouth(route);
    if (!m) return;
    const body = route.request().postDataJSON() as Omit<
      FakeOnboarding,
      "completed"
    >;
    const name = (body.preferredName ?? "").trim();
    const errors: Record<string, string> = {};
    if (!name) errors["preferredName"] = "Tell us what to call you.";
    else if (name.length > 60)
      errors["preferredName"] = "Use 60 characters or fewer.";
    if (
      body.pronouns !== null &&
      !["she/her", "he/him", "they/them"].includes(body.pronouns)
    )
      errors["pronouns"] = "Choose pronouns from the list.";
    if (body.step < 1 || body.step > 3)
      errors["step"] = "Choose a step from 1 to 3.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const completed = this.onboardings.get(m.id)?.completed ?? false;
    this.onboardings.set(m.id, { ...body, preferredName: name, completed });
    return route.fulfill({ status: 204 });
  }

  /** POST /learning/onboarding/complete: finishes the setup once, audited (L2-059 criterion 5). */
  private async completeOnboarding(route: Route): Promise<void> {
    const m = await this.consentedYouth(route);
    if (!m) return;
    const saved = this.onboardings.get(m.id);
    if (!saved?.preferredName)
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    if (!saved.completed) {
      saved.completed = true;
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "Completed",
        record: "YouthOnboarding",
        summary: `First-run setup completed as ${saved.preferredName}`,
        device: null,
      });
    }
    return route.fulfill({ status: 204 });
  }

  /** POST /learning/consent-request: the youth asks the guardians of their own household (L2-056 criterion 3). */
  private async askGuardian(route: Route): Promise<void> {
    const m = await this.participantModuleCaller(route, "Learning", can.learn);
    if (!m) return;
    const childId = this.youthLinks.get(m.id);
    const household = childId
      ? this.households.find((h) => h.children.some((c) => c.id === childId))
      : undefined;
    if (!childId || !household)
      return route.fulfill({ status: 409, json: { code: "not-needed" } });
    return this.deliverConsentLink(route, m.organizationId, household, childId);
  }

  /** Every /curriculum call (L2-066, L2-067): Learning on and AuthorCurriculum, then the caller's organization only. */
  private async author(
    route: Route,
    handle: (organizationId: string) => Promise<void>,
  ): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Learning",
      can.authorCurriculum,
    );
    if (!m) return;
    return handle(m.organizationId);
  }

  /** The mentor's scope (L2-065, ADR 0049): cohorts on their team that are not archived, and their youth, direct or through those cohorts. */
  private mentorScope(m: Membership): {
    cohorts: { program: FakeProgram; isLead: boolean }[];
    youth: FakeChild[];
  } {
    const cohorts = this.programs
      .filter(
        (p) => p.organizationId === m.organizationId && p.status === "Active",
      )
      .map((program) => ({ program, team: this.cohortMentors.get(program.id) }))
      .filter(
        (x) =>
          x.team && (x.team.lead === m.id || x.team.supporting.includes(m.id)),
      )
      .map((x) => ({ program: x.program, isLead: x.team!.lead === m.id }));
    const ids = new Set(
      [...this.youthMentors]
        .filter(([, mentor]) => mentor === m.id)
        .map(([child]) => child),
    );
    cohorts.forEach((c) => c.program.roster.forEach((id) => ids.add(id)));
    const youth = this.households
      .filter((h) => h.organizationId === m.organizationId)
      .flatMap((h) => h.children)
      .filter((c) => ids.has(c.id))
      .sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        ),
      );
    return { cohorts, youth };
  }

  private mentoredYouthRow(c: FakeChild): {
    id: string;
    name: string;
    age: number | null;
    programs: string[];
  } {
    const programs = this.programs
      .filter((p) => p.status === "Active" && p.roster.includes(c.id))
      .map((p) => p.name)
      .sort();
    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      age: ageOf(c.dateOfBirth),
      programs,
    };
  }

  /** GET /mentoring/youth: every youth in the mentor's scope with age and programs (L2-062 criterion 5, L2-063 criterion 4). */
  private async mentoredYouth(route: Route): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      can.mentorYouth,
    );
    if (!m) return;
    return route.fulfill({
      json: {
        youth: this.mentorScope(m).youth.map((c) => this.mentoredYouthRow(c)),
      },
    });
  }

  /** The mentor's reviews (L2-080, L2-081, ADR 0057). */
  readonly reviews = new FakeReviews(
    this.curriculumState,
    this.learningState.work,
    this.learningState.quizzes,
  );

  /** A youth's journey, badges and progress (L2-087, L2-088), read from the other fakes. */
  readonly journey = new FakeJourney(
    this.learningState,
    this.progression,
    this.reviews,
    this.badges,
  );

  /** Every review endpoint: Mentoring and Learning on and MentorYouth, then his youth accounts. */
  /** After a youth's learning event: her automatic badges are checked (L2-085), as BadgeAwarder does. */
  private async afterLearning(
    m: Membership,
    handled: Promise<void>,
  ): Promise<void> {
    await handled;
    this.awardBadges(m.organizationId, m.id);
  }

  /** After a mentor's approval or grade: the badges of each of his youth are checked (L2-085). */
  private async afterReview(
    youth: YouthAccounts,
    handled: Promise<void>,
  ): Promise<void> {
    await handled;
    for (const id of youth.keys())
      this.awardBadges(
        memberships.find((x) => x.id === id)!.organizationId,
        id,
      );
  }

  /** POST /curriculum/badges/{id}/awards (L2-085 criterion 4): the youth is told who awarded it. */
  private async awardBadgeByHand(
    route: Route,
    org: string,
    id: string,
  ): Promise<void> {
    const by = memberships.find((x) => x.id === this.membershipId)!.personName;
    const awarded = await this.badges.award(
      route,
      org,
      id,
      by,
      NOW.toISOString(),
    );
    if (!awarded) return;
    this.notifications.push({
      id: `n-${this.nextId++}`,
      organizationId: org,
      membershipId: awarded.membershipId,
      kind: "learning",
      text: `${by} awarded you the ${awarded.badge} badge.`,
      link: "/learning",
      createdAt: new Date(NOW.getTime() + this.nextId * 1000).toISOString(),
      readAt: null,
    });
  }

  private awardBadges(org: string, membershipId: string): void {
    const l = this.learningState;
    const earned = this.badges.evaluate(
      org,
      membershipId,
      {
        lessonDone: (id) => l.isDone(membershipId, id),
        quizPassed: (id) => {
          const quiz = this.curriculumState.assessments.quizzes.find(
            (q) => q.id === id,
          );
          return !!quiz && l.quizzes.passed(membershipId, quiz);
        },
        accepted: (id) => l.work.mine(membershipId, id)?.status === "Accepted",
      },
      NOW.toISOString(),
    );
    for (const name of earned) {
      this.notifications.push({
        id: `n-${this.nextId++}`,
        organizationId: org,
        membershipId,
        kind: "learning",
        text: `You earned the ${name} badge.`,
        link: "/learning",
        createdAt: new Date(NOW.getTime() + this.nextId * 1000).toISOString(),
        readAt: null,
      });
    }
  }

  private async mentorReviews(
    route: Route,
    then: (m: Membership, youth: YouthAccounts) => Promise<void>,
  ): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      can.mentorYouth,
    );
    if (!m) return;
    if (!this.modules.get(m.organizationId)!.includes("Learning"))
      return route.fulfill({ status: 404 });
    const children = new Set(this.mentorScope(m).youth.map((c) => c.id));
    const youth: YouthAccounts = new Map(
      [...this.youthLinks]
        .filter(
          ([id, child]) => children.has(child) && !this.removedMembers.has(id),
        )
        .map(
          ([id]) =>
            [id, memberships.find((x) => x.id === id)!.personName] as [
              string,
              string,
            ],
        )
        .filter(([id]) =>
          memberships.some(
            (x) => x.id === id && x.organizationId === m.organizationId,
          ),
        ),
    );
    return then(m, youth);
  }

  /** GET /mentoring/dashboard (L2-063): youth, cohorts and, while Roll Call is on, attendance of the last 7 and 14 days. */
  private async mentorDashboard(route: Route): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      can.mentorYouth,
    );
    if (!m) return;
    const scope = this.mentorScope(m);
    const youth = scope.youth.map((c) => this.mentoredYouthRow(c));
    const cohorts = scope.cohorts
      .map(({ program, isLead }) => ({
        programId: program.id,
        name: program.name,
        term: program.term,
        role: isLead ? "Lead" : "Supporting",
        youthCount: program.roster.length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!this.modules.get(m.organizationId)!.includes("RollCall")) {
      return route.fulfill({
        json: {
          youth,
          cohorts,
          checkedInThisWeek: null,
          recentActivity: null,
          followUps: this.mentorFollowUps(
            m,
            scope.youth.map((c) => c.id),
          ),
          checkInEveryDays: this.mentorCheckInDays.get(m.organizationId) ?? 14,
          checkInsDue: this.mentorCheckInsDue(m, youth),
        },
      });
    }
    const now = NOW.getTime();
    const changes = this.mentorAttendance(
      m,
      scope.youth.map((c) => c.id),
    ).filter((a) => now - Date.parse(a.startsAt) <= 14 * 86400000);
    const week = new Set(
      changes
        .filter(
          (a) =>
            a.kind !== "Absent" && now - Date.parse(a.startsAt) <= 7 * 86400000,
        )
        .map((a) => a.childId),
    );
    const recentActivity = changes
      .map(({ childId, youthName, kind, session, at }) => ({
        childId,
        youthName,
        kind,
        session,
        at,
      }))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 5);
    return route.fulfill({
      json: {
        youth,
        cohorts,
        checkedInThisWeek: week.size,
        recentActivity,
        followUps: this.mentorFollowUps(
          m,
          scope.youth.map((c) => c.id),
        ),
        checkInEveryDays: this.mentorCheckInDays.get(m.organizationId) ?? 14,
        checkInsDue: this.mentorCheckInsDue(m, youth),
      },
    });
  }

  /** His latest mentor check-in of each youth, when it has a follow-up date, soonest first; overdue before today (L2-090 criterion 6). */
  private mentorFollowUps(
    m: Membership,
    childIds: string[],
  ): {
    childId: string;
    youthName: string;
    followUpOn: string;
    overdue: boolean;
  }[] {
    const latest = new Map<string, FakeMentorCheckIn>();
    for (const r of this.mentorCheckIns.rows.filter(
      (x) =>
        x.organizationId === m.organizationId &&
        x.mentorId === m.id &&
        childIds.includes(x.childId),
    )) {
      const seen = latest.get(r.childId);
      if (
        !seen ||
        r.date > seen.date ||
        (r.date === seen.date && r.createdAt > seen.createdAt)
      )
        latest.set(r.childId, r);
    }
    return [...latest.values()]
      .filter((r) => r.followUpOn)
      .sort(
        (a, b) =>
          a.followUpOn!.localeCompare(b.followUpOn!) ||
          a.youthName.localeCompare(b.youthName),
      )
      .map((r) => ({
        childId: r.childId,
        youthName: r.youthName,
        followUpOn: r.followUpOn!,
        overdue: r.followUpOn! < TODAY,
      }));
  }

  /** Attendance of these children at sessions of the mentor's organization that have started, as activity rows. */
  private mentorAttendance(
    m: Membership,
    childIds: string[],
  ): {
    childId: string;
    youthName: string;
    kind: string;
    session: string;
    at: string;
    startsAt: string;
    status: string;
  }[] {
    const children = this.households.flatMap((h) => h.children);
    return this.events
      .filter(
        (e) =>
          e.organizationId === m.organizationId &&
          Date.parse(e.startsAt) <= NOW.getTime(),
      )
      .flatMap((e) =>
        [...this.sessionRecords(e.id)]
          .filter(([id, r]) => childIds.includes(id) && r.status !== "NotYet")
          .map(([id, r]) => {
            const c = children.find((x) => x.id === id)!;
            const kind =
              r.status === "SignedOut"
                ? "SignedOut"
                : r.status === "Absent"
                  ? "Absent"
                  : "CheckedIn";
            const at =
              kind === "SignedOut"
                ? (r.signedOutAt ?? e.startsAt)
                : kind === "Absent"
                  ? e.startsAt
                  : (r.checkedInAt ?? e.startsAt);
            return {
              childId: id,
              youthName: `${c.firstName} ${c.lastName}`,
              kind,
              session: e.name,
              at,
              startsAt: e.startsAt,
              status: r.status,
            };
          }),
      );
  }

  /** GET /mentoring/youth/{childId} (L2-064): the mentor-safe record; 404 outside the organization, 403 (audited) outside the scope. */
  private async mentorYouthRecord(
    route: Route,
    childId: string,
  ): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      can.mentorYouth,
    );
    if (!m) return;
    const household = this.households.find(
      (h) =>
        h.organizationId === m.organizationId &&
        h.children.some((c) => c.id === childId),
    );
    if (!household) return route.fulfill({ status: 404 });
    const scope = this.mentorScope(m);
    const child = household.children.find((c) => c.id === childId)!;
    if (!scope.youth.some((c) => c.id === childId)) {
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "AccessDenied",
        record: "Child",
        summary: "Mentor record outside the mentor’s youth",
        device: null,
      });
      return route.fulfill({ status: 403, json: { code: "forbidden" } });
    }
    const mentorId = this.youthMentors.get(childId);
    const mentor = mentorId
      ? (this.activeMentors(m.organizationId).find((x) => x.id === mentorId)
          ?.name ?? null)
      : null;
    const youthAccount = [...this.youthLinks].find(
      ([, c]) => c === childId,
    )?.[0];
    const setup = youthAccount ? this.onboardings.get(youthAccount) : undefined;
    const done = setup?.completed ? setup : null;
    const guardians = [...household.guardians]
      .sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) ||
          a.name.localeCompare(b.name),
      )
      .map((g) => ({
        name: g.name,
        relationship: g.relationship,
        mobile: g.mobile,
        email: g.email,
        isPrimary: g.isPrimary,
      }));
    const recentAttendance = this.modules
      .get(m.organizationId)!
      .includes("RollCall")
      ? this.mentorAttendance(m, [childId])
          .map((a) => ({ session: a.session, at: a.at, status: a.kind }))
          .sort((a, b) => b.at.localeCompare(a.at))
          .slice(0, 10)
      : null;
    this.auditEntries.push({
      organizationId: m.organizationId,
      when: NOW.toISOString(),
      who: m.personName,
      action: "Viewed",
      record: "Child",
      summary: `${child.firstName} ${child.lastName} · mentor record`,
      device: null,
    });
    const row = this.mentoredYouthRow(child);
    return route.fulfill({
      json: {
        id: child.id,
        name: row.name,
        preferredName: done?.preferredName ?? null,
        pronouns: done?.pronouns ?? null,
        age: row.age,
        school: child.school,
        programs: row.programs,
        mentor,
        guardians,
        recentAttendance,
      },
    });
  }

  /** A child of the mentor's organization in his scope; 404 outside the organization, 403 (audited) outside the scope (L2-090 criterion 8). */
  private async mentorCheckInChild(
    route: Route,
    m: Membership,
    childId: string,
  ): Promise<{ id: string; name: string } | null | undefined> {
    const child = this.households
      .filter((h) => h.organizationId === m.organizationId)
      .flatMap((h) => h.children)
      .find((c) => c.id === childId);
    if (!child) {
      await route.fulfill({ status: 404 });
      return undefined;
    }
    if (!this.mentorScope(m).youth.some((c) => c.id === childId)) {
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "AccessDenied",
        record: "Child",
        summary: "Mentor check-in outside the mentor’s youth",
        device: null,
      });
      await route.fulfill({ status: 403, json: { code: "forbidden" } });
      return undefined;
    }
    return { id: child.id, name: `${child.firstName} ${child.lastName}` };
  }

  /** GET /mentoring/check-ins (L2-090 criterion 4): his own check-ins of youth in his scope, newest first, filtered by youth or kind. */
  private async mentorCheckInHistory(route: Route): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      can.mentorYouth,
    );
    if (!m) return;
    const url = new URL(route.request().url());
    const childId = url.searchParams.get("childId");
    const kind = url.searchParams.get("kind");
    if (
      childId &&
      (await this.mentorCheckInChild(route, m, childId)) === undefined
    )
      return;
    const youth = this.mentorScope(m).youth.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
    }));
    const ids = new Set(youth.map((y) => y.id));
    const items = this.mentorCheckIns.rows
      .filter(
        (r) =>
          r.organizationId === m.organizationId &&
          r.mentorId === m.id &&
          ids.has(r.childId),
      )
      .filter((r) => !childId || r.childId === childId)
      .filter((r) => !kind || r.kind === kind)
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          b.createdAt.localeCompare(a.createdAt),
      )
      .map((r) => this.mentorCheckIns.view(r));
    return route.fulfill({
      json: {
        items,
        youth: [...youth].sort((a, b) => a.name.localeCompare(b.name)),
      },
    });
  }

  /** POST /mentoring/check-ins (L2-090 criteria 1 to 3, 7 and 8): audited as Created without its words. */
  private async logMentorCheckIn(route: Route): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      can.mentorYouth,
    );
    if (!m) return;
    const childId = (
      route.request().postDataJSON() as { childId?: string | null }
    ).childId;
    let child: { id: string; name: string } | null = null;
    if (childId) {
      const found = await this.mentorCheckInChild(route, m, childId);
      if (found === undefined) return;
      child = found;
    }
    const before = this.mentorCheckIns.rows.length;
    await this.mentorCheckIns.log(route, m.organizationId, m.id, child);
    if (this.mentorCheckIns.rows.length > before) {
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "Created",
        record: "MentorCheckIn",
        summary: `Mentor check-in with ${child!.name} by ${m.personName}`,
        device: null,
      });
    }
  }

  /** GET /mentoring/flags (L2-091 criterion 4): a mentor reads the flags on youth in his scope; admins and program directors every flag. */
  private async listAtRiskFlags(route: Route): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      (x) => can.mentorYouth(x) || can.reviewAtRiskFlags(x),
    );
    if (!m) return;
    const mentor = can.mentorYouth(m);
    const scope = mentor ? this.mentorScope(m).youth : [];
    const ids = new Set(scope.map((c) => c.id));
    const visible = this.atRiskFlags.rows.filter(
      (f) =>
        f.organizationId === m.organizationId &&
        (!mentor || ids.has(f.childId)),
    );
    const { items, openCount, resolvedCount } = this.atRiskFlags.list(
      visible,
      new URL(route.request().url()).searchParams.get("status"),
    );
    const youth = scope
      .map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return route.fulfill({
      json: {
        items: items.map((f) => this.atRiskFlags.view(f)),
        openCount,
        resolvedCount,
        youth,
        canRaise: mentor,
      },
    });
  }

  /** POST /mentoring/flags (L2-091 criteria 1, 2, 3, 6 and 8): mentors only, a youth in his scope; audited without the reason, readers notified. */
  private async raiseAtRiskFlag(route: Route): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      (x) => can.mentorYouth(x) || can.reviewAtRiskFlags(x),
    );
    if (!m) return;
    if (!can.mentorYouth(m))
      return route.fulfill({ status: 403, json: { code: "forbidden" } });
    const childId = (
      route.request().postDataJSON() as { childId?: string | null }
    ).childId;
    let child: { id: string; name: string } | null = null;
    if (childId) {
      const found = await this.mentorCheckInChild(route, m, childId);
      if (found === undefined) return;
      child = found;
    }
    const before = this.atRiskFlags.rows.length;
    await this.atRiskFlags.raise(
      route,
      m.organizationId,
      { id: m.id, name: m.personName },
      child,
    );
    if (this.atRiskFlags.rows.length > before) {
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "Created",
        record: "AtRiskFlag",
        summary: `At-risk flag on ${child!.name} by ${m.personName}`,
        device: null,
      });
      this.notifyFlag(
        m.organizationId,
        m.personName,
        child!.name,
        this.atRiskFlags.rows.at(-1)!.severity,
      );
    }
  }

  /** POST /mentoring/flags/{id}/resolve (L2-091 criteria 5, 6 and 8): a mentor of the youth, an admin or a program director; audited without the note. */
  private async resolveAtRiskFlag(route: Route, id: string): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      (x) => can.mentorYouth(x) || can.reviewAtRiskFlags(x),
    );
    if (!m) return;
    const flag = this.atRiskFlags.rows.find(
      (f) => f.id === id && f.organizationId === m.organizationId,
    );
    if (!flag) return route.fulfill({ status: 404 });
    if (
      can.mentorYouth(m) &&
      (await this.mentorCheckInChild(route, m, flag.childId)) === undefined
    )
      return;
    const wasOpen = flag.status === "Open";
    await this.atRiskFlags.resolve(route, flag, m.personName);
    if (wasOpen && flag.status === "Resolved") {
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "Updated",
        record: "AtRiskFlag",
        summary: `At-risk flag on ${flag.youthName} resolved by ${m.personName}`,
        device: null,
      });
    }
  }

  /** The work assigned to a youth's own child, only while Mentoring is on (L2-092 criteria 5 and 6). */
  private assignedTo(m: Membership) {
    const childId = this.youthLinks.get(m.id);
    if (!childId || !this.modules.get(m.organizationId)!.includes("Mentoring"))
      return [];
    return this.assignedWork.rows.filter(
      (r) => r.organizationId === m.organizationId && r.childId === childId,
    );
  }

  /** The caller when a mentor with Mentoring and Learning on (L2-092 criterion 6); otherwise answers 401, 403 or 404. */
  private async mentorLearning(route: Route): Promise<Membership | null> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      can.mentorYouth,
    );
    if (!m) return null;
    if (!this.modules.get(m.organizationId)!.includes("Learning")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return m;
  }

  /** The active programs a child is on in the organization. */
  private activeProgramsOf(org: string, childId: string): FakeProgram[] {
    return this.programs.filter(
      (p) =>
        p.organizationId === org &&
        p.status === "Active" &&
        p.roster.includes(childId),
    );
  }

  /** GET /mentoring/assign-work (L2-092 criterion 1): the published work of the tracks his youth follow, his youth and his cohorts. */
  private async assignWorkOptions(route: Route): Promise<void> {
    const m = await this.mentorLearning(route);
    if (!m) return;
    const scope = this.mentorScope(m);
    const tracksOf = (childId: string) => [
      ...new Set(
        this.activeProgramsOf(m.organizationId, childId)
          .map((p) => this.assignedWork.trackOf(p))
          .filter((t): t is string => !!t),
      ),
    ];
    const items = this.assignedWork
      .items([...new Set(scope.youth.flatMap((c) => tracksOf(c.id)))])
      .filter((i) => i.published);
    const published = new Set(items.map((i) => i.trackId));
    return route.fulfill({
      json: {
        items: items.map((i) => ({
          id: i.id,
          kind: i.kind,
          title: i.title,
          moduleTitle: i.moduleTitle,
          trackId: i.trackId,
          trackName: i.trackName,
        })),
        youth: scope.youth.map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          cohorts: this.activeProgramsOf(m.organizationId, c.id)
            .map((p) => p.name)
            .sort()
            .join(", "),
          trackIds: tracksOf(c.id).filter((t) => published.has(t)),
          atRisk: this.atRiskFlags.rows.some(
            (f) =>
              f.organizationId === m.organizationId &&
              f.childId === c.id &&
              f.status === "Open",
          ),
        })),
        cohorts: scope.cohorts
          .filter((c) => c.program.roster.length > 0)
          .sort((a, b) => a.program.name.localeCompare(b.program.name))
          .map((c) => ({
            id: c.program.id,
            name: c.program.name,
            youthCount: c.program.roster.length,
            trackId: this.assignedWork.trackOf(c.program),
          })),
      },
    });
  }

  /** POST /mentoring/assigned-work (L2-092 criteria 2 to 4 and 7): 404 outside the organization, 403 outside his scope, audited without the message. */
  private async assignWork(route: Route): Promise<void> {
    const m = await this.mentorLearning(route);
    if (!m) return;
    const b = route.request().postDataJSON() as {
      itemId?: string | null;
      childIds?: string[] | null;
      programId?: string | null;
    };
    const item = b.itemId
      ? this.assignedWork.item(m.organizationId, b.itemId)
      : null;
    if (b.itemId && !item) return route.fulfill({ status: 404 });
    const children = this.households
      .filter((h) => h.organizationId === m.organizationId)
      .flatMap((h) => h.children);
    const ids = [...new Set(b.childIds ?? [])];
    if (ids.some((id) => !children.some((c) => c.id === id)))
      return route.fulfill({ status: 404 });
    const program = b.programId
      ? this.programs.find(
          (p) => p.id === b.programId && p.organizationId === m.organizationId,
        )
      : null;
    if (b.programId && !program) return route.fulfill({ status: 404 });
    const scope = this.mentorScope(m);
    const outside = ids.find((id) => !scope.youth.some((c) => c.id === id));
    if (
      outside ||
      (program && !scope.cohorts.some((c) => c.program.id === program.id))
    ) {
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "AccessDenied",
        record: outside ? "Child" : "Program",
        summary: "Assigning work outside the mentor’s scope",
        device: null,
      });
      return route.fulfill({ status: 403, json: { code: "forbidden" } });
    }
    const chosen: Recipient[] = ids.map((id) => {
      const c = children.find((x) => x.id === id)!;
      const trackIds = this.activeProgramsOf(m.organizationId, id)
        .map((p) => this.assignedWork.trackOf(p))
        .filter((t): t is string => !!t);
      return { id, name: `${c.firstName} ${c.lastName}`, trackIds };
    });
    const cohort = program ? { program, roster: program.roster } : null;
    const count = await this.assignedWork.assign(
      route,
      m.organizationId,
      m.personName,
      item ?? null,
      chosen,
      cohort,
    );
    if (count > 0) {
      const childIds = cohort ? cohort.roster : ids;
      const youth = [...this.youthLinks]
        .filter(([, child]) => childIds.includes(child))
        .map(([youthId]) => youthId);
      const due = new Date(
        `${(route.request().postDataJSON() as { dueOn: string }).dueOn}T12:00:00Z`,
      )
        .toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        })
        .replace(",", "");
      this.notify(
        m.organizationId,
        youth,
        "assignments",
        `${m.personName} assigned you the ${item!.title} ${item!.kind.toLowerCase()}, due ${due}.`,
        "/learning",
      );
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "Created",
        record: "AssignedWork",
        summary: `${m.personName} assigned ${item!.title} to ${count} youth`,
        device: null,
      });
    }
  }

  /** A flag a mentor raised earlier, with the notifications admins and program directors got (L2-091 criterion 3). */
  seedRaisedFlag(row: Parameters<FakeAtRiskFlags["seed"]>[0]): void {
    this.atRiskFlags.seed(row);
    this.notifyFlag(
      row.organizationId ?? "org-harbourview",
      row.raisedBy,
      row.youthName,
      row.severity,
    );
  }

  /** Notifies every admin and program director of the organization of a new flag, without the reason. Mirrors backend NotificationWriter. */
  private notifyFlag(
    organizationId: string,
    raisedBy: string,
    youthName: string,
    severity: string,
  ): void {
    for (const r of memberships.filter(
      (x) => x.organizationId === organizationId && can.reviewAtRiskFlags(x),
    )) {
      this.notifications.push({
        id: `n-${this.nextId++}`,
        organizationId,
        membershipId: r.id,
        kind: "mentoring",
        text: `${raisedBy} flagged ${youthName} as at risk (${severity}).`,
        link: "/mentoring/flags",
        createdAt: new Date(NOW.getTime() + this.nextId * 1000).toISOString(),
        readAt: null,
      });
    }
  }

  /** GET and PUT /mentoring/youth/{childId}/competencies (L2-082): Mentoring on; 404 outside the organization, 403 (audited) outside the scope. */
  /** GET /mentoring/youth/{childId}/reflections (L2-089 criteria 5 and 6): Mentoring and Learning on, a youth in the mentor's scope. */
  private async mentorReflections(
    route: Route,
    childId: string,
  ): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      can.mentorYouth,
    );
    if (!m) return;
    if (!this.modules.get(m.organizationId)!.includes("Learning"))
      return route.fulfill({ status: 404 });
    const child = this.households
      .filter((h) => h.organizationId === m.organizationId)
      .flatMap((h) => h.children)
      .find((c) => c.id === childId);
    if (!child) return route.fulfill({ status: 404 });
    if (!this.mentorScope(m).youth.some((c) => c.id === childId)) {
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "AccessDenied",
        record: "Child",
        summary: "Shared reflections outside the mentor’s youth",
        device: null,
      });
      return route.fulfill({ status: 403, json: { code: "forbidden" } });
    }
    const name = `${child.firstName} ${child.lastName}`;
    this.auditEntries.push({
      organizationId: m.organizationId,
      when: NOW.toISOString(),
      who: m.personName,
      action: "Viewed",
      record: "Child",
      summary: `${name} · shared reflections`,
      device: null,
    });
    const youth = [...this.youthLinks]
      .filter(
        ([id, c]) =>
          c === childId &&
          memberships.some(
            (x) => x.id === id && x.organizationId === m.organizationId,
          ),
      )
      .map(([id]) => id);
    return this.reflectionsState.shared(route, childId, name, youth, (id) => {
      const lesson = this.curriculumState.lessons.find((l) => l.id === id);
      const module = lesson
        ? this.curriculumState.modules.find((x) => x.id === lesson.moduleId)
        : undefined;
      return lesson && module
        ? { title: lesson.title, moduleTitle: module.title }
        : null;
    });
  }

  private async mentorCompetencies(
    route: Route,
    childId: string,
    save: boolean,
  ): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      can.mentorYouth,
    );
    if (!m) return;
    const child = this.households
      .filter((h) => h.organizationId === m.organizationId)
      .flatMap((h) => h.children)
      .find((c) => c.id === childId);
    if (!child) return route.fulfill({ status: 404 });
    if (!this.mentorScope(m).youth.some((c) => c.id === childId)) {
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "AccessDenied",
        record: "Child",
        summary: "Competencies outside the mentor’s youth",
        device: null,
      });
      return route.fulfill({ status: 403, json: { code: "forbidden" } });
    }
    const name = `${child.firstName} ${child.lastName}`;
    return save
      ? this.reviews.saveCompetencies(
          route,
          m.organizationId,
          childId,
          name,
          m.personName,
          NOW.toISOString(),
        )
      : this.reviews.competencySheet(route, m.organizationId, childId, name);
  }

  /** GET /mentoring/cohorts/{programId} (L2-065): a cohort on the mentor's team; 404 outside the organization, 403 (audited) otherwise. */
  private async mentorCohort(route: Route, programId: string): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Mentoring",
      can.mentorYouth,
    );
    if (!m) return;
    const program = this.programs.find(
      (p) => p.id === programId && p.organizationId === m.organizationId,
    );
    if (!program) return route.fulfill({ status: 404 });
    const mine = this.mentorScope(m).cohorts.find(
      (c) => c.program.id === programId,
    );
    if (!mine) {
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "AccessDenied",
        record: "Program",
        summary: `${program.name} · not on the mentor’s team`,
        device: null,
      });
      return route.fulfill({ status: 403, json: { code: "forbidden" } });
    }
    const mentors = this.activeMentors(m.organizationId);
    const nameOf = (id: string | undefined) =>
      mentors.find((x) => x.id === id)?.name ?? null;
    const team = this.cohortMentors.get(programId)!;
    const children = this.households.flatMap((h) => h.children);
    const members = program.roster
      .map((id) => children.find((c) => c.id === id)!)
      .sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        ),
      )
      .map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        age: ageOf(c.dateOfBirth),
        mentor: nameOf(this.youthMentors.get(c.id)),
      }));
    return route.fulfill({
      json: {
        programId,
        name: program.name,
        term: program.term,
        schedule: program.schedule,
        role: mine.isLead ? "Lead" : "Supporting",
        lead: nameOf(team.lead),
        supporting: team.supporting
          .map((id) => nameOf(id))
          .filter((n): n is string => !!n)
          .sort(),
        members,
      },
    });
  }

  /** Records a child's attendance at a session, as Roll Call would. */
  recordAttendance(
    eventId: string,
    childId: string,
    status: "Present" | "Absent" | "SignedOut",
    at: string | null,
    flags: { late?: boolean; excused?: boolean } = {},
  ): void {
    this.sessionRecords(eventId).set(childId, {
      status,
      checkedInAt: status === "Absent" ? null : at,
      signedOutAt: status === "SignedOut" ? at : null,
      late: status !== "Absent" && !!flags.late,
      excused: status === "Absent" && !!flags.excused,
    });
  }

  /** PUT /sessions/{id}/attendance/{childId} (L2-097 criteria 4 to 6): admins and program directors correct a mark with a reason. Mirrors CorrectAttendanceHandler. */
  private async correctAttendance(
    route: Route,
    id: string,
    childId: string,
  ): Promise<void> {
    const m = await this.rollCallCaller(route);
    if (!m) return;
    if (!can.correctAttendance(m)) return this.forbidden(route);
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      status?: string | null;
      reason?: string | null;
    };
    const errors: Record<string, string> = {};
    if (!["Present", "Late", "Excused", "Absent"].includes(b.status ?? ""))
      errors["status"] = "Choose a mark.";
    const reason = (b.reason ?? "").trim();
    if (!reason) errors["reason"] = "Say why you’re correcting it.";
    else if (reason.length > 500)
      errors["reason"] = "Keep it to 500 characters.";
    if (e.status === "Cancelled")
      errors["session"] = "This session is cancelled.";
    else if (e.startsAt > NOW.toISOString())
      errors["session"] = "This session hasn’t started yet.";
    const records = this.sessionRecords(e.id);
    const program = this.programs.find((p) => p.id === e.programId)!;
    const child = this.households
      .flatMap((h) => h.children)
      .find((c) => c.id === childId);
    if (!child || (!records.has(childId) && !program.roster.includes(childId)))
      errors["childId"] =
        `${child ? `${child.firstName} ${child.lastName}` : "This child"} is not on this cohort’s roster.`;
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const r = records.get(childId);
    const here = b.status === "Present" || b.status === "Late";
    records.set(
      childId,
      here
        ? {
            ...(r ?? { checkedInAt: null }),
            status: r?.status === "SignedOut" ? "SignedOut" : "Present",
            checkedInAt: r?.checkedInAt ?? e.startsAt,
            late: b.status === "Late",
            excused: false,
          }
        : {
            status: "Absent",
            checkedInAt: null,
            late: false,
            excused: b.status === "Excused",
          },
    );
    this.auditEntries.push({
      organizationId: m.organizationId,
      when: NOW.toISOString(),
      who: m.personName,
      action: "Updated",
      record: "Attendance",
      summary: `Correction · ${child!.firstName} ${child!.lastName} · ${e.name} · ${b.status} · ${reason}`,
      device: null,
    });
    return route.fulfill({ status: 204 });
  }

  /** GET /attendance (L2-097): a cohort's sessions that have started and each youth on its roster, with rates. Mirrors AttendanceHistoryHandler. */
  private async attendanceHistory(route: Route): Promise<void> {
    const m = await this.rollCallCaller(route);
    if (!m) return;
    if (!can.reviewAttendance(m)) return this.forbidden(route);
    const active = this.programs.filter(
      (p) => p.organizationId === m.organizationId && p.status !== "Archived",
    );
    const mine =
      m.role === "Mentor"
        ? active.filter((p) => {
            const t = this.cohortMentors.get(p.id);
            return !!t && (t.lead === m.id || t.supporting.includes(m.id));
          })
        : active;
    const cohorts = mine
      .map((p) => ({ id: p.id, name: p.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const canCorrect = can.correctAttendance(m);
    const chosen =
      new URL(route.request().url()).searchParams.get("programId") ||
      cohorts[0]?.id;
    if (!chosen)
      return route.fulfill({
        json: {
          cohorts,
          programId: null,
          programName: null,
          schedule: null,
          rate: null,
          sessionsRecorded: 0,
          sessionsHeld: 0,
          belowThreshold: 0,
          canCorrect,
          sessions: [],
          youth: [],
        },
      });
    const program = this.programs.find(
      (p) => p.id === chosen && p.organizationId === m.organizationId,
    );
    if (!program) return route.fulfill({ status: 404 });
    if (!cohorts.some((c) => c.id === chosen)) {
      if (m.role === "Mentor") {
        this.auditEntries.push({
          organizationId: m.organizationId,
          when: NOW.toISOString(),
          who: m.personName,
          action: "AccessDenied",
          record: "Program",
          summary: `${program.name} · attendance history, not on the mentor’s team`,
          device: null,
        });
        return this.forbidden(route);
      }
      return route.fulfill({ status: 404 });
    }
    type Mark = "Present" | "Late" | "Excused" | "Absent";
    const markOf = (r: FakeAttendance | undefined): Mark | null =>
      !r
        ? null
        : r.status === "Present" || r.status === "SignedOut"
          ? r.late
            ? "Late"
            : "Present"
          : r.status === "Absent"
            ? r.excused
              ? "Excused"
              : "Absent"
            : null;
    const rate = (attended: number, marked: number) =>
      marked ? Math.round((100 * attended) / marked) : null;
    const attended = (k: Mark) => k === "Present" || k === "Late";
    const now = NOW.toISOString();
    const events = this.events
      .filter(
        (e) =>
          e.programId === chosen &&
          e.status !== "Cancelled" &&
          e.startsAt <= now,
      )
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    const children = this.households.flatMap((h) => h.children);
    const marks = events.flatMap((e) =>
      [...this.sessionRecords(e.id)]
        .filter(([id]) => children.some((c) => c.id === id))
        .map(([childId, r]) => ({ eventId: e.id, childId, mark: markOf(r) }))
        .filter(
          (x): x is { eventId: string; childId: string; mark: Mark } =>
            x.mark !== null,
        ),
    );
    const count = (list: Mark[], k: Mark) => list.filter((x) => x === k).length;
    const sessions = events.map((e) => {
      const list = marks.filter((x) => x.eventId === e.id).map((x) => x.mark);
      const status =
        e.status !== "Ended" && now < e.endsAt
          ? "InProgress"
          : !list.length
            ? "NotRecorded"
            : e.status === "Ended" || list.length >= program.roster.length
              ? "Recorded"
              : "NeedsReview";
      return {
        eventId: e.id,
        name: e.name,
        startsAt: e.startsAt,
        present: count(list, "Present"),
        late: count(list, "Late"),
        excused: count(list, "Excused"),
        absent: count(list, "Absent"),
        rate: rate(list.filter(attended).length, list.length),
        status,
      };
    });
    const youth = program.roster
      .map((id) => children.find((c) => c.id === id)!)
      .map((c) => {
        const list = marks.filter((x) => x.childId === c.id).map((x) => x.mark);
        const a = list.filter(attended).length;
        return {
          childId: c.id,
          name: `${c.firstName} ${c.lastName}`,
          attended: a,
          marked: list.length,
          late: count(list, "Late"),
          excused: count(list, "Excused"),
          absent: count(list, "Absent"),
          rate: rate(a, list.length),
          belowThreshold: list.length > 0 && a < 0.7 * list.length,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return route.fulfill({
      json: {
        cohorts,
        programId: program.id,
        programName: program.name,
        schedule: program.schedule,
        rate: rate(marks.filter((x) => attended(x.mark)).length, marks.length),
        sessionsRecorded: sessions.filter(
          (x) => x.present + x.late + x.excused + x.absent > 0,
        ).length,
        sessionsHeld: sessions.length,
        belowThreshold: youth.filter((y) => y.belowThreshold).length,
        canCorrect,
        sessions,
        youth,
      },
    });
  }

  /** Each child's one mentor (L2-062): child id to mentor membership id. */
  private youthMentors = new Map<string, string>();
  /** Each cohort's mentor team: program id to its lead and supporting mentors. */
  private cohortMentors = new Map<
    string,
    { lead: string; supporting: string[] }
  >();

  /** More accounts at Harbourview, as accepted invitations would add them: Youth worker 01 to n (L2-112 paging). */
  addPeople(count: number): void {
    for (let i = 1; i <= count; i++) {
      const n = String(i).padStart(2, "0");
      memberships.push({
        id: `m-worker-${n}`,
        organizationId: "org-harbourview",
        personName: `Worker ${n}`,
        email: `worker${n}@harbourview.example`,
        role: "YouthWorker",
      });
    }
  }

  /** Removes every other account of the person's organization, as a brand-new organization would have only its founder. */
  leaveOnly(membershipId: string): void {
    const keep = memberships.find((m) => m.id === membershipId)!;
    for (const m of memberships)
      if (m.organizationId === keep.organizationId && m.id !== keep.id)
        this.removedMembers.add(m.id);
  }

  /** Deactivated accounts with when and by whom (ADR 0070); the session treats them like removed memberships. */
  private deactivatedMembers = new Map<string, { at: string; by: string }>();
  /** Youth accounts whose child record was deleted with its household. */
  private deletedChildRecords = new Set<string>();

  /** An admin deactivated this account, as POST /people/{id}/deactivate would. */
  deactivatePerson(id: string, by = "Tom Nguyen"): void {
    this.deactivatedMembers.set(id, { at: "2026-11-05T21:20:00Z", by });
    this.removedMemberships.add(id);
  }

  /** The youth account's household was deleted: the account is deactivated with its child record and stays off. */
  deleteChildRecordOf(id: string): void {
    this.deletedChildRecords.add(id);
    this.deactivatePerson(id);
  }

  /** Assigns a mentor to a child, as a program director would from a cohort's roster. */
  assignYouthMentor(childId: string, mentorId: string): void {
    this.youthMentors.set(childId, mentorId);
  }

  /** Sets a cohort's mentor team, as a program director would. */
  setCohortTeam(
    programId: string,
    lead: string,
    supporting: string[] = [],
  ): void {
    this.cohortMentors.set(programId, { lead, supporting });
  }

  private activeMentors(
    organizationId: string,
  ): { id: string; name: string }[] {
    return memberships
      .filter(
        (x) =>
          x.organizationId === organizationId &&
          x.role === "Mentor" &&
          !this.removedMemberships.has(x.id),
      )
      .map((x) => ({ id: x.id, name: x.personName }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** The caller and the cohort for a mentor assignment endpoint: Roster and Mentoring on, the caller's own program (L2-062 criteria 7, 8). */
  private async mentoringCohort(
    route: Route,
    programId: string,
    write: boolean,
  ): Promise<{ m: Membership; p: FakeProgram } | null> {
    const m = await this.rosterCaller(route);
    if (!m) return null;
    if (write && !can.managePrograms(m)) {
      await this.forbidden(route);
      return null;
    }
    const p = this.ownProgram(m, programId);
    if (!this.modules.get(m.organizationId)!.includes("Mentoring") || !p) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return { m, p };
  }

  private async cohortMentoring(
    route: Route,
    programId: string,
  ): Promise<void> {
    const found = await this.mentoringCohort(route, programId, false);
    if (!found) return;
    const { m, p } = found;
    const mentors = this.activeMentors(m.organizationId);
    const byId = (id: string | undefined) =>
      mentors.find((x) => x.id === id) ?? null;
    const team = this.cohortMentors.get(p.id);
    const children = this.childrenOf(m);
    const youth = p.roster
      .map((cid) => children.find((x) => x.child.id === cid))
      .filter((x) => !!x)
      .sort(
        (a, b) =>
          a!.child.lastName.localeCompare(b!.child.lastName) ||
          a!.child.firstName.localeCompare(b!.child.firstName),
      )
      .map((x) => ({
        childId: x!.child.id,
        name: `${x!.child.firstName} ${x!.child.lastName}`,
        mentor: byId(this.youthMentors.get(x!.child.id)),
      }));
    return route.fulfill({
      json: {
        programId: p.id,
        lead: byId(team?.lead),
        supporting: (team?.supporting ?? [])
          .map(byId)
          .filter((x) => !!x)
          .sort((a, b) => a!.name.localeCompare(b!.name)),
        youth,
        mentors,
      },
    });
  }

  private async assignYouthMentorRoute(
    route: Route,
    programId: string,
    childId: string,
  ): Promise<void> {
    const found = await this.mentoringCohort(route, programId, true);
    if (!found) return;
    const { m, p } = found;
    if (!p.roster.includes(childId)) return route.fulfill({ status: 404 });
    const { mentorId } = route.request().postDataJSON() as {
      mentorId: string | null;
    };
    const invalid = (message: string) =>
      route.fulfill({ status: 422, json: { errors: { mentorId: message } } });
    if (p.status === "Archived") return invalid(`${p.name} is archived.`);
    if (!mentorId) return invalid("Choose a mentor.");
    if (!this.activeMentors(m.organizationId).some((x) => x.id === mentorId))
      return invalid("Choose an active mentor.");
    this.youthMentors.set(childId, mentorId);
    return route.fulfill({ status: 204 });
  }

  private async removeYouthMentor(
    route: Route,
    programId: string,
    childId: string,
  ): Promise<void> {
    const found = await this.mentoringCohort(route, programId, true);
    if (!found) return;
    if (!found.p.roster.includes(childId))
      return route.fulfill({ status: 404 });
    if (found.p.status === "Archived")
      return route.fulfill({
        status: 422,
        json: { errors: { mentorId: `${found.p.name} is archived.` } },
      });
    this.youthMentors.delete(childId);
    return route.fulfill({ status: 204 });
  }

  private async setCohortMentors(
    route: Route,
    programId: string,
  ): Promise<void> {
    const found = await this.mentoringCohort(route, programId, true);
    if (!found) return;
    const { m, p } = found;
    const b = route.request().postDataJSON() as {
      leadMentorId: string | null;
      supportingMentorIds: string[];
    };
    const supporting = [...new Set(b.supportingMentorIds ?? [])];
    const errors: Record<string, string> = {};
    if (p.status === "Archived")
      errors["leadMentorId"] = `${p.name} is archived.`;
    else if (!b.leadMentorId) errors["leadMentorId"] = "Choose a lead mentor.";
    else if (supporting.includes(b.leadMentorId))
      errors["supportingMentorIds"] =
        "The lead mentor can’t also be a supporting mentor.";
    else if (
      ![b.leadMentorId, ...supporting].every((id) =>
        this.activeMentors(m.organizationId).some((x) => x.id === id),
      )
    )
      errors["leadMentorId"] = "Choose active mentors.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    this.cohortMentors.set(p.id, { lead: b.leadMentorId!, supporting });
    return route.fulfill({ status: 204 });
  }

  /** Mirrors backend PublicSiteResolver: the organization an address names while it runs and Public website is on, else undefined (ADR 0075). */
  private publishedSite(slug: string) {
    const organization = organizations.find(
      (o) => this.websiteProfileOf(o.id).slug === slug.toLowerCase(),
    );
    return organization &&
      !this.suspended.has(organization.id) &&
      this.modules.get(organization.id)!.includes("PublicWebsite")
      ? organization
      : undefined;
  }

  private readonly websiteState = new FakeWebsite();
  /** Learning Bond links and agreement acceptances (ADR 0076). */
  /** Learning Bond (ADR 0076): tests forget an acceptance or publish a new agreement version through it. */
  readonly learningBond = Object.assign(new FakeLearningBond(), { isSuspended: (id: string) => this.suspended.has(id) });
  private readonly websiteRequestState = new FakeWebsiteRequests(() => NOW);

  /** The requests visitors sent to an organization's public website, oldest first (L2-134). */
  websiteRequests(organizationId: string, kind: WebsiteRequestKind): FakeWebsiteRequest[] {
    return this.websiteRequestState.of(organizationId, kind);
  }

  /** A request a visitor sent earlier, to reach the hourly limit. */
  addWebsiteRequest(organizationId: string, kind: WebsiteRequestKind, email: string): void {
    this.websiteRequestState.add(organizationId, kind, email);
  }

  /** POST /website/{slug}/contact, /volunteer and /donations: anonymous, mirrors WebsiteRequestsHandler. */
  private paymentProvider = true;

  /** Whether organizations have a payment provider set up; without one a donation answers 503 unavailable (ADR 0075). */
  setPaymentProvider(configured: boolean): void {
    this.paymentProvider = configured;
  }

  private async websiteRequest(route: Route, slug: string, kind: "contact" | "volunteer" | "donations"): Promise<void> {
    const organization = this.publishedSite(slug);
    if (!organization) return route.fulfill({ status: 404 });
    const body = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
    const answer =
      kind === "contact"
        ? this.websiteRequestState.contact(organization.id, body)
        : kind === "volunteer"
          ? this.websiteRequestState.volunteer(organization.id, body)
          : this.websiteRequestState.donate(organization.id, body, this.paymentProvider);
    return route.fulfill(answer.json === undefined ? { status: answer.status } : { status: answer.status, json: answer.json });
  }

  /** GET /website/{slug}/content: anonymous, published content only (L2-133). */
  private async websiteContent(route: Route, slug: string): Promise<void> {
    const organization = this.publishedSite(slug);
    if (!organization) return route.fulfill({ status: 404 });
    return route.fulfill({ json: this.websiteState.content(this.websiteSource(organization.id)) });
  }

  private websiteSource(org: string): WebsiteSource {
    return {
      modules: this.modules.get(org)!,
      programs: this.programs.filter((p) => p.organizationId === org),
      enrollmentSlug: (programId) => this.enrollmentSlugs.get(programId),
      tracks: this.curriculumState.tracks.filter((t) => t.organizationId === org),
      curriculumModules: this.curriculumState.modules.filter((m) => m.organizationId === org),
      programTrack: (programId) => this.curriculumState.programTracks.get(programId),
      badges: this.badges.badges.filter((b) => b.organizationId === org),
      leadMentor: (programId) => {
        const lead = this.cohortMentors.get(programId)?.lead;
        if (!lead || this.removedMembers.has(lead) || this.deactivatedMembers.has(lead)) return null;
        return memberships.find((x) => x.id === lead && x.organizationId === org)?.personName ?? null;
      },
      today: TODAY,
    };
  }

  /** GET /website/{slug}: anonymous; unknown, suspended and module-off all answer 404 (L2-005 criterion 7). */
  private async website(route: Route, slug: string): Promise<void> {
    const organization = this.publishedSite(slug);
    if (!organization) {
      return route.fulfill({ status: 404 });
    }
    const profile = this.websiteProfileOf(organization.id);
    return route.fulfill({
      json: {
        name: organization.name,
        city: organization.city,
        tagline: profile.tagline,
        about: profile.about,
        email: profile.contactEmail,
      },
    });
  }

  /** Five consecutive failures for this email, as if they had just been made (L2-047). */
  lock(email: string): void {
    this.signInFailures.set(email, 5);
  }

  /** Records failed sign-ins; the fifth consecutive one starts the lock, audited in each organization of the email (L2-047). */
  failSignIn(email: string, times: number): void {
    for (let i = 0; i < times; i++) {
      const failures = (this.signInFailures.get(email) ?? 0) + 1;
      this.signInFailures.set(email, failures);
      if (failures !== 5) continue;
      for (const m of memberships.filter((x) => x.email === email)) {
        this.auditEntries.push({
          organizationId: m.organizationId,
          when: NOW.toISOString(),
          who: m.personName,
          action: "SignInLocked",
          record: "StaffUser",
          summary: "Sign-in locked after 5 failed attempts",
          device: null,
        });
      }
    }
  }

  isLocked(email: string): boolean {
    return (this.signInFailures.get(email) ?? 0) >= 5;
  }

  private async signIn(route: Route): Promise<void> {
    const { email, password } = route.request().postDataJSON() as {
      email: string;
      password: string;
    };
    const key = email.trim().toLowerCase();
    if ((this.signInFailures.get(key) ?? 0) >= 5) {
      return route.fulfill({
        status: 423,
        json: { code: "locked", lockedUntil: "2026-11-05T21:27:00Z" },
      });
    }
    const membership = memberships
      .filter((m) => m.email === key && !this.removedMemberships.has(m.id))
      .sort((a, b) => a.organizationId.localeCompare(b.organizationId))[0];
    // The right password with every membership removed: told only now, never for a wrong password (L2-050).
    if (
      !membership &&
      password === this.passwordOf(key) &&
      memberships.some((m) => m.email === key)
    ) {
      return route.fulfill({
        status: 403,
        json: { code: "account-deactivated" },
      });
    }
    if (!membership || password !== this.passwordOf(key)) {
      this.failSignIn(key, 1);
      return route.fulfill({
        status: 401,
        json: { code: "invalid-credentials" },
      });
    }
    // Only consecutive failures count: a success starts the count again.
    this.signInFailures.delete(key);
    if (MFA_ROLES.has(membership.role)) {
      this.mfaPending = membership.id;
      return route.fulfill({ json: { status: "mfa-required" } });
    }
    this.startSession(membership.id);
    return route.fulfill({ json: { status: "signed-in" } });
  }

  private async mfa(route: Route): Promise<void> {
    const { code } = route.request().postDataJSON() as { code: string };
    if (!this.mfaPending) {
      return route.fulfill({ status: 401, json: { code: "mfa-expired" } });
    }
    if (code !== seededMfaCode) {
      return route.fulfill({ status: 401, json: { code: "invalid-code" } });
    }
    this.startSession(this.mfaPending);
    this.mfaPending = null;
    return route.fulfill({ json: { status: "signed-in" } });
  }

  private async signOut(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      return this.unauthenticated(route);
    }
    // The session ends on the server and the sign-out is audited in its organization (L2-048).
    this.auditEntries.push({
      organizationId: m.organizationId,
      when: NOW.toISOString(),
      who: m.personName,
      action: "SignedOut",
      record: "StaffUser",
      summary: "Signed out",
      device: null,
    });
    this.membershipId = null;
    return route.fulfill({ status: 204 });
  }

  /** Mirrors backend AuditLogHandler. */
  private async auditLog(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    if (m.role !== "Admin") return this.forbidden(route);
    const url = new URL(route.request().url());
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const action = url.searchParams.get("action");
    const days = Number(url.searchParams.get("days") ?? 7);
    const since = new Date(NOW.getTime() - days * 86400000).toISOString();
    const entries = this.auditEntries
      .filter((e) => e.organizationId === m.organizationId && e.when >= since)
      .filter((e) => !action || e.action === action)
      .filter(
        (e) =>
          !q || `${e.who} ${e.record} ${e.summary}`.toLowerCase().includes(q),
      )
      .sort((a, b) => b.when.localeCompare(a.when))
      .map(({ organizationId: _, ...e }) => e);
    return route.fulfill({
      json: { entries, total: entries.length, page: 1, pageSize: 50 },
    });
  }

  /** Organizations a platform admin suspended (with the reason) and added in this test (L2-003). */
  private suspended = new Map<string, string>();
  private addedOrganizations: {
    id: string;
    name: string;
    plan: "Free" | "Standard" | "Plus";
    modulesOn: number;
  }[] = [];
  /** Welcome emails sent to new organizations' first admins. */
  readonly welcomeEmails: string[] = [];

  suspend(organizationId: string, reason = "Unpaid invoice"): void {
    this.suspended.set(organizationId, reason);
  }

  /** Mirrors backend PlatformOrganizationsHandler: only platform admins (Tom in the seed). */
  private platformCaller(route: Route): Membership | null {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      void this.unauthenticated(route);
      return null;
    }
    if (m.email !== "tom@harbourview.example") {
      void this.forbidden(route);
      return null;
    }
    return m;
  }

  private async platformOrganizations(route: Route): Promise<void> {
    if (!this.platformCaller(route)) return;
    const url = new URL(route.request().url());
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const plan = url.searchParams.get("plan");
    const status = url.searchParams.get("status");
    const rows = [
      ...organizations.map((o) => ({
        id: o.id,
        name: o.name,
        plan: this.planOf(o.id),
        activeChildren: this.households
          .filter((h) => h.organizationId === o.id)
          .reduce((n, h) => n + h.children.length, 0),
        modulesOn: this.modules.get(o.id)!.length,
        setUp: o.id === "org-harbourview",
      })),
      ...this.addedOrganizations.map((o) => ({
        ...o,
        activeChildren: 0,
        setUp: false,
      })),
    ]
      .map(({ setUp, ...o }) => ({
        ...o,
        status: this.suspended.has(o.id)
          ? "Suspended"
          : setUp
            ? "Active"
            : "SettingUp",
        suspensionReason: this.suspended.get(o.id) ?? null,
      }))
      .filter((o) => !q || o.name.toLowerCase().includes(q))
      .filter((o) => !plan || o.plan === plan)
      .filter((o) => !status || o.status === status)
      .sort((a, b) => a.name.localeCompare(b.name));
    return route.fulfill({ json: { organizations: rows } });
  }

  private async addOrganization(route: Route): Promise<void> {
    if (!this.platformCaller(route)) return;
    const body = route.request().postDataJSON() as {
      name?: string;
      adminEmail?: string;
      plan?: string;
      preset?: string;
    };
    const name = (body.name ?? "").trim();
    const email = (body.adminEmail ?? "").trim().toLowerCase();
    const errors: Record<string, string> = {};
    if (!name) errors["name"] = "Enter the organization’s name.";
    else if (
      [...organizations, ...this.addedOrganizations].some(
        (o) => o.name === name,
      )
    )
      errors["name"] = "An organization with this name already exists.";
    if (!email) errors["adminEmail"] = "Enter the first admin’s email.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      errors["adminEmail"] = "That doesn’t look like an email address.";
    const presets: Record<string, number> = {
      "Whole suite": 8,
      "Just check-in": 3,
      "Just slips": 2,
    };
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const id = `org-added-${this.addedOrganizations.length + 1}`;
    this.addedOrganizations.push({
      id,
      name,
      plan: body.plan as "Free" | "Standard",
      modulesOn: presets[body.preset ?? ""] ?? 8,
    });
    this.welcomeEmails.push(email);
    return route.fulfill({ status: 201, json: { id } });
  }

  private async suspendOrganization(route: Route, id: string): Promise<void> {
    if (!this.platformCaller(route)) return;
    const { reason } = route.request().postDataJSON() as { reason?: string };
    if (!reason?.trim())
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            reason: "Give a reason; the organization’s admins will see it.",
          },
        },
      });
    this.suspended.set(id, reason.trim());
    return route.fulfill({ status: 204 });
  }

  private async reinstateOrganization(route: Route, id: string): Promise<void> {
    if (!this.platformCaller(route)) return;
    this.suspended.delete(id);
    return route.fulfill({ status: 204 });
  }

  failPayment(organizationId: string, at = "2026-11-01T12:00:00Z"): void {
    this.paymentFailed.set(organizationId, at);
  }

  private planOf(organizationId: string): "Free" | "Standard" | "Plus" {
    return (
      this.plans.get(organizationId) ??
      organizations.find((o) => o.id === organizationId)!.plan
    );
  }

  private static readonly terms = {
    Free: { price: 0, children: 50, sms: 200 },
    Standard: { price: 89, children: 500, sms: 2000 },
    Plus: { price: 149, children: 2000, sms: 5000 },
  };

  /** Mirrors backend BillingHandler. */
  private async billing(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    if (m.role !== "Admin") return this.forbidden(route);
    const plan = this.planOf(m.organizationId);
    const t = FakeApi.terms[plan];
    const active = new Set(
      this.programs
        .filter((p) => p.organizationId === m.organizationId)
        .flatMap((p) => p.roster),
    ).size;
    const failed = this.paymentFailed.get(m.organizationId);
    const graceUntil = failed
      ? new Date(new Date(failed).getTime() + 14 * 86400000).toISOString()
      : null;
    const status = !graceUntil
      ? "Active"
      : NOW.toISOString() < graceUntil
        ? "PaymentFailed"
        : "Suspended";
    return route.fulfill({
      json: {
        plan,
        monthlyPrice: t.price,
        childLimit: t.children,
        activeChildren: active,
        smsUsed: this.smsUsed.get(m.organizationId) ?? 0,
        smsCap: t.sms,
        status,
        graceUntil,
      },
    });
  }

  private async changePlan(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    if (m.role !== "Admin") return this.forbidden(route);
    const b = route.request().postDataJSON() as {
      plan: "Free" | "Standard" | "Plus";
    };
    const current = this.planOf(m.organizationId);
    if (!(b.plan in FakeApi.terms))
      return route.fulfill({
        status: 422,
        json: { errors: { plan: "Choose Free, Standard or Plus." } },
      });
    if (b.plan === current)
      return route.fulfill({
        status: 422,
        json: { errors: { plan: `You’re already on ${b.plan}.` } },
      });
    const proratedCharge = Math.max(
      0,
      Math.round(
        (((FakeApi.terms[b.plan].price - FakeApi.terms[current].price) * 26) /
          30) *
          100,
      ) / 100,
    );
    this.plans.set(m.organizationId, b.plan);
    return route.fulfill({ json: { plan: b.plan, proratedCharge } });
  }

  /** Removed memberships (as an admin would remove them); a session in one falls back to the person's next. */
  private removedMemberships = new Set<string>();

  /** An admin removes every membership of this person (L2-050). */
  deactivate(email: string): void {
    for (const m of memberships.filter((x) => x.email === email))
      this.removedMemberships.add(m.id);
  }

  removeMembership(id: string): void {
    this.removedMemberships.add(id);
  }

  /** Mirrors backend SwitchOrganizationHandler: a person is their memberships with the same email. */
  private async myOrganizations(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const mine = memberships
      .filter((x) => x.email === m.email && !this.removedMemberships.has(x.id))
      .map((x) => ({
        membershipId: x.id,
        name: organizations.find((o) => o.id === x.organizationId)!.name,
        role: x.role,
        active: x.id === m.id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return route.fulfill({ json: { organizations: mine } });
  }

  private async switchOrganization(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const b = route.request().postDataJSON() as { membershipId: string };
    const target = memberships.find(
      (x) =>
        x.id === b.membershipId &&
        x.email === m.email &&
        !this.removedMemberships.has(x.id),
    );
    if (!target) return route.fulfill({ status: 404 });
    this.membershipId = target.id;
    return route.fulfill({ status: 204 });
  }

  expireReset(token: string): void {
    this.resetLinks.get(token)!.usable = false;
  }

  /** How many reset emails went to an address (L2-115). */
  resetEmailsTo(email: string): number {
    return this.resetEmails.get(email) ?? 0;
  }

  /**
   * Mirrors backend PasswordResetHandler: the same 202 for every address; an email only for an account with a current
   * membership, at most three an hour, and the new link replaces every earlier one (L2-115, ADR 0071).
   */
  private async forgotPassword(route: Route): Promise<void> {
    const b = route.request().postDataJSON() as { email: string };
    this.resetRequestedFor = b.email;
    const email = b.email.trim().toLowerCase();
    const current = this.hasCurrentMembership(email);
    const sent = this.resetEmailsTo(email);
    if (current && sent < 3) {
      for (const link of this.resetLinks.values())
        if (link.email === email) link.usable = false;
      this.resetLinks.set(`tok-reset-${email}-${sent + 1}`, {
        email,
        usable: true,
      });
      this.resetEmails.set(email, sent + 1);
    }
    return route.fulfill({ status: 202 });
  }

  private hasCurrentMembership(email: string): boolean {
    return memberships.some(
      (m) =>
        m.email === email &&
        !this.removedMemberships.has(m.id) &&
        !this.deactivatedMembers.has(m.id),
    );
  }

  private async checkReset(route: Route, token: string): Promise<void> {
    const link = this.resetLinks.get(token);
    if (!link?.usable || !this.hasCurrentMembership(link.email))
      return route.fulfill({ status: 410 });
    return route.fulfill({ json: { email: link.email } });
  }

  private async resetPassword(route: Route): Promise<void> {
    const b = route.request().postDataJSON() as {
      token: string;
      password: string;
      repeat: string;
    };
    const link = this.resetLinks.get(b.token);
    if (!link?.usable || !this.hasCurrentMembership(link.email))
      return route.fulfill({ status: 410 });
    const errors: Record<string, string> = {};
    const weak = passwordProblem(b.password, link.email);
    if (weak) errors["password"] = weak;
    if (b.repeat !== b.password)
      errors["repeat"] = "The two passwords don’t match.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    link.usable = false;
    const member = memberships.find((m) => m.email === link.email)!;
    if (this.isLocked(link.email)) {
      this.auditEntries.push({
        organizationId: member.organizationId,
        when: NOW.toISOString(),
        who: member.personName,
        action: "SignInUnlocked",
        record: "StaffUser",
        summary: "Unlocked sign-in by password reset",
        device: null,
      });
    }
    this.signInFailures.delete(link.email);
    this.membershipId = member.id;
    return route.fulfill({ json: { status: "signed-in" } });
  }

  /** Mirrors backend AccountHandler. */
  private async account(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const org = organizations.find((o) => o.id === m.organizationId)!;
    return route.fulfill({
      json: {
        name: this.profileOf(m.id).name,
        email: m.email,
        role: m.role,
        organization: org.name,
        mobile: this.profileOf(m.id).mobile,
        twoStepOn: ["Admin", "ProgramDirector"].includes(m.role),
        recoveryCodesLeft: this.recoveryCodes.get(m.email) ?? 0,
      },
    });
  }

  /** The name and mobile of a membership, as saved from its profile (L2-117). */
  profileOf(membershipId: string): { name: string; mobile: string | null } {
    const m = memberships.find((x) => x.id === membershipId)!;
    return (
      this.profiles.get(membershipId) ?? { name: m.personName, mobile: null }
    );
  }

  /** Mirrors backend ProfileHandler: the active membership only; a youth's name is read-only; audited without values. */
  private async saveProfile(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const b = route.request().postDataJSON() as {
      name?: string | null;
      mobile?: string | null;
    };
    const name = (b.name ?? "").trim();
    const mobile = (b.mobile ?? "").trim();
    const current = this.profileOf(m.id);
    const errors: Record<string, string> = {};
    if (!name) errors["name"] = "Enter your name.";
    else if (name.length > 100) errors["name"] = "Use at most 100 characters.";
    else if (m.role === "Youth" && name !== current.name)
      errors["name"] =
        "Your name comes from your record. Ask staff to change it.";
    if (mobile && mobile.replace(/\D/g, "").length !== 10)
      errors["mobile"] = "Include the area code, like 905-555-0101.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    this.profiles.set(m.id, { name, mobile: mobile || null });
    this.auditEntries.push({
      organizationId: m.organizationId,
      when: NOW.toISOString(),
      who: name,
      action: "Updated",
      record: "Membership",
      summary: `${name} updated their profile`,
      device: null,
    });
    return route.fulfill({ status: 204 });
  }

  /** A person's display preferences; System, Default and motion on until saved (L2-119, L2-120). */
  displayOf(email: string): FakeDisplay {
    return (
      this.displays.get(email) ?? {
        theme: "system",
        textSize: "default",
        reduceMotion: false,
      }
    );
  }

  /** Mirrors backend DisplayPreferencesHandler: the caller's own, by person. */
  private async getDisplay(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    return route.fulfill({ json: this.displayOf(m.email) });
  }

  /** Mirrors backend DisplayPreferencesHandler: only the known values; not audited. */
  private async saveDisplay(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const b = route.request().postDataJSON() as FakeDisplay;
    const errors: Record<string, string> = {};
    if (!["system", "light", "dark"].includes(b.theme))
      errors["theme"] = "Choose System, Light or Dark.";
    if (!["default", "large", "larger"].includes(b.textSize))
      errors["textSize"] = "Choose Default, Large or Larger.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    this.displays.set(m.email, {
      theme: b.theme,
      textSize: b.textSize,
      reduceMotion: !!b.reduceMotion,
    });
    return route.fulfill({ status: 204 });
  }

  /** The password an address signs in with now (L2-118). */
  passwordOf(email: string): string {
    return this.passwords.get(email) ?? seededPassword;
  }

  /** Mirrors backend ChangePasswordHandler: the current password, the policy, the repeat; other devices signed out; audited. */
  private async changePassword(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const b = route.request().postDataJSON() as {
      current?: string;
      password?: string;
      repeat?: string;
    };
    if (b.current !== this.passwordOf(m.email))
      return route.fulfill({
        status: 422,
        json: { errors: { current: "That isn’t your current password." } },
      });
    const errors: Record<string, string> = {};
    const weak = passwordProblem(b.password, m.email);
    if (weak) errors["password"] = weak;
    if (b.repeat !== b.password)
      errors["repeat"] = "The two passwords don’t match.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    this.passwords.set(m.email, b.password!);
    this.signedOutOthers = true;
    this.auditEntries.push({
      organizationId: m.organizationId,
      when: NOW.toISOString(),
      who: this.profileOf(m.id).name,
      action: "Updated",
      record: "StaffUser",
      summary: `${this.profileOf(m.id).name} changed their password`,
      device: null,
    });
    return route.fulfill({ status: 204 });
  }

  private async newRecoveryCodes(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    this.recoveryCodes.set(m.email, 10);
    const codes = Array.from(
      { length: 10 },
      (_, i) =>
        `k${i}x2-${(7000 + i * 37).toString(36).slice(-4).padStart(4, "m")}`,
    );
    return route.fulfill({ json: { codes } });
  }

  private async signOutOthers(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    this.signedOutOthers = true;
    return route.fulfill({ status: 204 });
  }

  /** Mirrors backend SetupHandler: each step is done when its data exists. */
  private async setup(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const steps = [
      { key: "organization", done: this.profiles.has(organizationId) },
      { key: "modules", done: true },
      {
        key: "program",
        done: this.programs.some((p) => p.organizationId === organizationId),
      },
      {
        key: "children",
        done: this.households.some(
          (h) => h.organizationId === organizationId && h.children.length > 0,
        ),
      },
      {
        key: "staff",
        done:
          memberships.filter((m) => m.organizationId === organizationId)
            .length > 1 ||
          this.invitations.some((i) => i.organizationId === organizationId),
      },
    ];
    if (this.modules.get(organizationId)!.includes("Slips"))
      steps.push({
        key: "slip",
        done: this.events.some(
          (e) =>
            e.organizationId === organizationId &&
            this.slipOf(e.id)?.status === "Sent",
        ),
      });
    const next = steps.find((s) => !s.done)?.key ?? null;
    return route.fulfill({ json: { steps, next, complete: next === null } });
  }

  private async getOrganizationProfile(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const org = organizations.find((o) => o.id === organizationId)!;
    const p = this.profiles.get(organizationId);
    return route.fulfill({
      json: {
        name: p?.name ?? org.name,
        city:
          p?.city ??
          (organizationId === "org-northgate"
            ? "Burlington, Ontario"
            : "Hamilton, Ontario"),
        plan: org.plan,
      },
    });
  }

  private async saveOrganizationProfile(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const b = route.request().postDataJSON() as { name: string; city: string };
    const errors: Record<string, string> = {};
    if (!b.name?.trim()) errors["name"] = "Enter your organization’s name.";
    if (!b.city?.trim()) errors["city"] = "Enter the city you work in.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    this.profiles.set(organizationId, {
      name: b.name.trim(),
      city: b.city.trim(),
    });
    return route.fulfill({ status: 204 });
  }

  /** The organization's profile as saved on Settings › Organization, or as seeded (mirrors backend OrganizationProfileHandler). */
  organizationDetailsOf(organizationId: string): FakeOrganizationDetails {
    const org = organizations.find((o) => o.id === organizationId)!;
    return (
      this.organizationDetails.get(organizationId) ?? {
        name: org.name,
        city: org.city ?? "",
        contactEmail: null,
        phone:
          organizationId === "org-northgate" ? "289-555-0190" : "905-555-0100",
        timeZone: "America/Toronto",
      }
    );
  }

  private async getOrganizationDetails(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const logo = this.organizationLogos.get(organizationId);
    return route.fulfill({
      json: {
        ...this.organizationDetailsOf(organizationId),
        hasLogo: !!logo,
        logo: logo
          ? {
              fileName: logo.fileName,
              uploadedAt: logo.uploadedAt,
              uploadedBy: logo.uploadedBy,
            }
          : null,
      },
    });
  }

  /** An organization's website profile as saved, or its seeded address with nothing written. */
  private websiteProfileOf(organizationId: string) {
    const org = organizations.find((o) => o.id === organizationId)!;
    return (
      this.websiteProfiles.get(organizationId) ?? {
        slug: org.slug ?? "",
        tagline: null,
        about: null,
        contactEmail: null,
      }
    );
  }

  /** Mirrors backend WebsiteProfileHandler, behind the Public website module. */
  private async getWebsiteProfile(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    if (!this.modules.get(organizationId)!.includes("PublicWebsite"))
      return route.fulfill({ status: 404 });
    return route.fulfill({ json: this.websiteProfileOf(organizationId) });
  }

  private async saveWebsiteProfile(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    if (!this.modules.get(organizationId)!.includes("PublicWebsite"))
      return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as Record<string, string | null>;
    const slug = (b["slug"] ?? "").trim();
    const tagline = (b["tagline"] ?? "").trim();
    const about = b["about"]?.trim() || null;
    const contactEmail = b["contactEmail"]?.trim().toLowerCase() || null;
    const errors: Record<string, string> = {};
    if (!/^[a-z][a-z0-9-]{2,39}$/.test(slug))
      errors["slug"] =
        "Use 3 to 40 lowercase letters, numbers and hyphens, starting with a letter.";
    else if (
      organizations.some(
        (o) =>
          o.id !== organizationId && this.websiteProfileOf(o.id).slug === slug,
      )
    )
      errors["slug"] =
        "Another organization uses this address. Choose another.";
    if (!tagline || tagline.length > 120)
      errors["tagline"] = "Write a tagline of up to 120 characters.";
    if (about && about.length > 1000)
      errors["about"] = "Use at most 1,000 characters.";
    if (contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail))
      errors["contactEmail"] = "Enter an email like hello@example.org.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    this.websiteProfiles.set(organizationId, {
      slug,
      tagline,
      about,
      contactEmail,
    });
    const who = memberships.find((m) => m.id === this.membershipId)!.personName;
    this.auditEntries.push({
      organizationId,
      when: NOW.toISOString(),
      who,
      action: "Updated",
      record: "Organization",
      summary: `Website profile at /site/${slug} saved by ${who}`,
      device: null,
    });
    return route.fulfill({ status: 204 });
  }

  /** Mirrors backend MentoringSettingsHandler: 7, 14, 21 or 30 days, behind the Mentoring module. */
  private async getMentoringSettings(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    if (!this.modules.get(organizationId)!.includes("Mentoring"))
      return route.fulfill({ status: 404 });
    return route.fulfill({
      json: {
        checkInEveryDays: this.mentorCheckInDays.get(organizationId) ?? 14,
      },
    });
  }

  private async saveMentoringSettings(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    if (!this.modules.get(organizationId)!.includes("Mentoring"))
      return route.fulfill({ status: 404 });
    const days = (
      route.request().postDataJSON() as { checkInEveryDays?: number }
    ).checkInEveryDays;
    if (![7, 14, 21, 30].includes(days ?? 0))
      return route.fulfill({
        status: 422,
        json: { errors: { checkInEveryDays: "Choose 7, 14, 21 or 30 days." } },
      });
    this.mentorCheckInDays.set(organizationId, days!);
    const who = memberships.find((m) => m.id === this.membershipId)!.personName;
    this.auditEntries.push({
      organizationId,
      when: NOW.toISOString(),
      who,
      action: "Updated",
      record: "MentoringSettings",
      summary: `Mentors check in every ${days} days, set by ${who}`,
      device: null,
    });
    return route.fulfill({ status: 204 });
  }

  /** His youth with no mentor check-in from him within the cadence: never-checked-in first, then the oldest, then by name (L2-125). */
  private mentorCheckInsDue(
    m: Membership,
    youth: { id: string; name: string }[],
  ): { childId: string; youthName: string; lastCheckIn: string | null }[] {
    const days = this.mentorCheckInDays.get(m.organizationId) ?? 14;
    const cutoff = new Date(Date.parse(`${TODAY}T12:00:00Z`) - days * 86400000)
      .toISOString()
      .slice(0, 10);
    return youth
      .map((y) => {
        const dates = this.mentorCheckIns.rows
          .filter(
            (r) =>
              r.organizationId === m.organizationId &&
              r.mentorId === m.id &&
              r.childId === y.id,
          )
          .map((r) => r.date)
          .sort();
        return {
          childId: y.id,
          youthName: y.name,
          lastCheckIn: dates.at(-1) ?? null,
        };
      })
      .filter((y) => y.lastCheckIn === null || y.lastCheckIn <= cutoff)
      .sort(
        (a, b) =>
          (a.lastCheckIn === null ? 0 : 1) - (b.lastCheckIn === null ? 0 : 1) ||
          (a.lastCheckIn ?? "").localeCompare(b.lastCheckIn ?? "") ||
          (a.youthName < b.youthName ? -1 : a.youthName > b.youthName ? 1 : 0),
      );
  }

  /** Mirrors backend OrganizationLogoHandler: a PNG or JPEG by its first bytes, up to 1 MB. */
  private async uploadOrganizationLogo(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const body = route.request().postDataBuffer() ?? Buffer.alloc(0);
    const text = body.toString("latin1");
    const fileName = /filename="([^"]*)"/.exec(text)?.[1] ?? "";
    const start = text.indexOf("\r\n\r\n", text.indexOf("filename=")) + 4;
    const end = text.indexOf("\r\n--", start);
    const bytes = body.subarray(start, end);
    const png = bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const jpeg = bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    if (bytes.length < 1 || bytes.length > 1024 * 1024 || (!png && !jpeg))
      return route.fulfill({
        status: 422,
        json: { errors: { file: "Choose a PNG or JPEG of up to 1 MB." } },
      });
    const who = memberships.find((m) => m.id === this.membershipId)!.personName;
    const logo = {
      fileName,
      uploadedAt: NOW.toISOString(),
      uploadedBy: who,
      contentType: png ? "image/png" : "image/jpeg",
      bytes: Buffer.from(bytes),
    };
    this.organizationLogos.set(organizationId, logo);
    this.auditEntries.push({
      organizationId,
      when: NOW.toISOString(),
      who,
      action: "Created",
      record: "OrganizationLogo",
      summary: `Logo ${fileName} uploaded by ${who}`,
      device: null,
    });
    return route.fulfill({
      status: 201,
      json: { fileName, uploadedAt: logo.uploadedAt, uploadedBy: who },
    });
  }

  private async organizationLogo(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const logo = this.organizationLogos.get(organizationId);
    if (!logo) return route.fulfill({ status: 404 });
    return route.fulfill({
      status: 200,
      contentType: logo.contentType,
      body: logo.bytes,
    });
  }

  private async removeOrganizationLogo(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const logo = this.organizationLogos.get(organizationId);
    if (!logo) return route.fulfill({ status: 404 });
    this.organizationLogos.delete(organizationId);
    const who = memberships.find((m) => m.id === this.membershipId)!.personName;
    this.auditEntries.push({
      organizationId,
      when: NOW.toISOString(),
      who,
      action: "Deleted",
      record: "OrganizationLogo",
      summary: `Logo ${logo.fileName} removed by ${who}`,
      device: null,
    });
    return route.fulfill({ status: 204 });
  }

  private async saveOrganizationDetails(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const b = route
      .request()
      .postDataJSON() as Partial<FakeOrganizationDetails>;
    const name = (b.name ?? "").trim();
    const city = (b.city ?? "").trim();
    const contactEmail = b.contactEmail?.trim().toLowerCase() || null;
    const phone = b.phone?.trim() || null;
    const timeZone = (b.timeZone ?? "").trim();
    const errors: Record<string, string> = {};
    const required = (value: string, field: string, empty: string) => {
      if (!value) errors[field] = empty;
      else if (value.length > 100)
        errors[field] = "Use at most 100 characters.";
    };
    required(name, "name", "Enter your organization’s name.");
    required(city, "city", "Enter the city you work in.");
    if (contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail))
      errors["contactEmail"] = "Enter an email like hello@example.org.";
    if (phone && phone.replace(/\D/g, "").slice(-10).length !== 10)
      errors["phone"] = "Include the area code, like 905-555-0100.";
    if (!FAKE_TIME_ZONES.includes(timeZone))
      errors["timeZone"] = "Choose a time zone from the list.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const before = this.organizationDetailsOf(organizationId);
    const after: FakeOrganizationDetails = {
      name,
      city,
      contactEmail,
      phone,
      timeZone,
    };
    const labels: Record<keyof FakeOrganizationDetails, string> = {
      name: "name",
      city: "city",
      contactEmail: "contact email",
      phone: "phone",
      timeZone: "time zone",
    };
    const changed = (Object.keys(labels) as (keyof FakeOrganizationDetails)[])
      .filter((k) => before[k] !== after[k])
      .map((k) => labels[k]);
    this.organizationDetails.set(organizationId, after);
    if (changed.length) {
      const who = memberships.find(
        (m) => m.id === this.membershipId,
      )!.personName;
      this.auditEntries.push({
        organizationId,
        when: NOW.toISOString(),
        who,
        action: "Updated",
        record: "Organization",
        summary: `Organization profile: ${changed.join(", ")} changed by ${who}`,
        device: null,
      });
    }
    return route.fulfill({ status: 204 });
  }

  /** A request a guardian already sent (seeded as the API would store it). */
  askedForData(
    householdId: string,
    kind: "Export" | "Delete",
    email = "carmen.rivera@example.com",
  ): void {
    const h = this.households.find((x) => x.id === householdId)!;
    this.dataRequests.push({
      id: `dr-${this.nextId++}`,
      organizationId: h.organizationId,
      householdId,
      household: h.name,
      kind,
      email,
      fulfilledBy: null,
    });
  }

  /** Mirrors backend DataRequestHandler. */
  private async askForData(route: Route, token: string): Promise<void> {
    const householdId = this.homeLinks.get(token);
    const household = householdId
      ? this.households.find((h) => h.id === householdId)
      : undefined;
    if (!household)
      return route.fulfill({ status: 410, json: { code: "link-expired" } });
    if (!this.trustedHouseholds.has(household.id))
      return route.fulfill({
        status: 401,
        json: { code: "verification-required" },
      });
    const b = route.request().postDataJSON() as {
      kind: "Export" | "Delete";
      email: string;
    };
    if (!b.email?.trim())
      return route.fulfill({
        status: 422,
        json: { errors: { email: "Enter an email." } },
      });
    const id = `dr-${this.nextId++}`;
    this.dataRequests.push({
      id,
      organizationId: household.organizationId,
      householdId: household.id,
      household: household.name,
      kind: b.kind,
      email: b.email.trim(),
      fulfilledBy: null,
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  private async listDataRequests(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const requests = this.dataRequests
      .filter((r) => r.organizationId === organizationId)
      .sort((a, b) => Number(!!a.fulfilledBy) - Number(!!b.fulfilledBy))
      .map((r) => ({
        id: r.id,
        household: r.household,
        kind: r.kind,
        email: r.email,
        requestedAt: NOW.toISOString(),
        status: r.fulfilledBy ? "Fulfilled" : "Open",
        fulfilledBy: r.fulfilledBy,
      }));
    return route.fulfill({ json: { requests } });
  }

  private async fulfilDataRequest(route: Route, id: string): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const r = this.dataRequests.find(
      (x) => x.id === id && x.organizationId === organizationId,
    );
    if (!r) return route.fulfill({ status: 404 });
    if (r.fulfilledBy) return route.fulfill({ status: 409 });
    r.fulfilledBy = memberships.find(
      (m) => m.id === this.membershipId,
    )!.personName;
    if (r.kind === "Delete")
      this.households = this.households.filter((h) => h.id !== r.householdId);
    return route.fulfill({ status: 204 });
  }

  /** Mirrors backend PrivacyHandler. */
  private async getPrivacy(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const years = this.retention.has(organizationId)
      ? this.retention.get(organizationId)!
      : 7;
    return route.fulfill({
      json: { region: "Canada (Toronto region)", consentRetentionYears: years },
    });
  }

  private async savePrivacy(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const b = route.request().postDataJSON() as {
      consentRetentionYears: number | null;
    };
    if (
      b.consentRetentionYears !== null &&
      ![7, 3].includes(b.consentRetentionYears)
    ) {
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            consentRetentionYears:
              "Choose 7 years, 3 years or until deleted by request.",
          },
        },
      });
    }
    this.retention.set(organizationId, b.consentRetentionYears);
    return route.fulfill({ status: 204 });
  }

  /** The consent policy of an organization: as saved, or 18 with the default wording (L2-056). */
  consentPolicyOf(organizationId: string): {
    consentAge: number;
    wording: string;
  } {
    const name = organizations.find((o) => o.id === organizationId)!.name;
    return (
      this.consentPolicies.get(organizationId) ?? {
        consentAge: 18,
        wording: `I consent to my child taking part in lessons, mentoring and program activities at ${name}, and to staff contacting them about their program.`,
      }
    );
  }

  /** GET /settings/consent (Roster) and /settings/learning (Learning, L2-124): the one consent policy behind either module gate. */
  private async getConsentPolicy(
    route: Route,
    module: ModuleId = "Roster",
  ): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    if (!this.modules.get(organizationId)!.includes(module))
      return route.fulfill({ status: 404 });
    return route.fulfill({ json: this.consentPolicyOf(organizationId) });
  }

  private async saveConsentPolicy(
    route: Route,
    module: ModuleId = "Roster",
  ): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    if (!this.modules.get(organizationId)!.includes(module))
      return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      consentAge: number;
      wording: string;
    };
    const wording = (b.wording ?? "").trim();
    const errors: Record<string, string> = {};
    if (!(b.consentAge >= 13 && b.consentAge <= 19))
      errors["consentAge"] = "Choose an age from 13 to 19.";
    if (wording.length < 20 || wording.length > 2000)
      errors["wording"] =
        "Write the wording guardians sign, 20 to 2,000 characters.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    this.consentPolicies.set(organizationId, {
      consentAge: b.consentAge,
      wording,
    });
    return route.fulfill({ status: 204 });
  }

  private notificationSettingsOf(organizationId: string) {
    const plan = organizations.find((o) => o.id === organizationId)!.plan;
    const cap = plan === "Free" ? 200 : plan === "Standard" ? 2000 : 5000;
    return (
      this.notificationSettings.get(organizationId) ?? {
        noShowDelayMinutes: 15,
        emailSupervisorsOnIncidents: true,
        smsCap: cap,
      }
    );
  }

  /** Mirrors backend NotificationSettingsHandler. */
  private async getNotificationSettings(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    return route.fulfill({
      json: {
        ...this.notificationSettingsOf(organizationId),
        smsUsed: this.smsUsed.get(organizationId) ?? 0,
      },
    });
  }

  private async saveNotificationSettings(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const b = route.request().postDataJSON() as {
      noShowDelayMinutes: number;
      emailSupervisorsOnIncidents: boolean;
      smsCap: number;
    };
    const used = this.smsUsed.get(organizationId) ?? 0;
    const errors: Record<string, string> = {};
    if (!(b.noShowDelayMinutes >= 5 && b.noShowDelayMinutes <= 60))
      errors["noShowDelayMinutes"] = "Choose between 5 and 60 minutes.";
    if (!(b.smsCap >= Math.max(0, used)))
      errors["smsCap"] =
        `Can’t be below ${used.toLocaleString("en-US")}, already used this month.`;
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    this.notificationSettings.set(organizationId, {
      noShowDelayMinutes: b.noShowDelayMinutes,
      emailSupervisorsOnIncidents: b.emailSupervisorsOnIncidents,
      smsCap: b.smsCap,
    });
    return route.fulfill({ status: 204 });
  }

  /** Modules on for the signed-in organization, or a 401/403 answer when the caller may not manage them. */
  private async settingsCaller(route: Route): Promise<string | null> {
    const membership = memberships.find((m) => m.id === this.membershipId);
    if (!membership) {
      await this.unauthenticated(route);
      return null;
    }
    if (!["Admin", "ProgramDirector"].includes(membership.role)) {
      await route.fulfill({ status: 403, json: { code: "forbidden" } });
      return null;
    }
    return membership.organizationId;
  }

  private async getModules(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const on = this.modules.get(organizationId)!;
    return route.fulfill({
      json: {
        modules: moduleCatalog.map((m) => ({
          id: m.id,
          name: m.name,
          on: on.includes(m.id),
          needs: m.needs,
        })),
      },
    });
  }

  private async saveModules(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const { on } = route.request().postDataJSON() as { on: ModuleId[] };
    const errors: { module: string; message: string }[] = [];
    const name = (id: ModuleId) => moduleCatalog.find((m) => m.id === id)!.name;
    if (!on.includes("Roster")) {
      const dependents = moduleCatalog
        .filter((m) => on.includes(m.id) && m.needs.includes("Roster"))
        .map((m) => m.name);
      if (dependents.length) {
        const list =
          dependents.length === 1
            ? dependents[0]
            : `${dependents.slice(0, -1).join(", ")} and ${dependents.at(-1)}`;
        errors.push({
          module: "Roster",
          message: `${list} ${dependents.length === 1 ? "needs" : "need"} the roster.`,
        });
      }
    }
    for (const m of moduleCatalog.filter((c) => on.includes(c.id))) {
      const missing = m.needs.filter((n) => n !== "Roster" && !on.includes(n));
      if (missing.length)
        errors.push({
          module: m.id,
          message: `${m.name} needs ${missing.map(name).join(" and ")}.`,
        });
    }
    // Learning Bond turns on only once the current agreement is accepted; once on it stays on (L2-135 criterion 4).
    if (
      !errors.length &&
      on.includes("LearningBond") &&
      !this.modules.get(organizationId)!.includes("LearningBond") &&
      !this.learningBond.hasAccepted(organizationId)
    ) {
      errors.push({
        module: "LearningBond",
        message: "Accept the Learning Bond data-handling agreement first.",
      });
    }
    if (errors.length) {
      return route.fulfill({ status: 422, json: { errors } });
    }
    this.modules.set(
      organizationId,
      moduleCatalog.map((m) => m.id).filter((id) => on.includes(id)),
    );
    return route.fulfill({ json: { on: on.length } });
  }

  /** The signed-in membership when Roster is on for its organization; otherwise answers 401 or 404 and returns null. */
  private async rosterCaller(route: Route): Promise<Membership | null> {
    const membership = memberships.find((m) => m.id === this.membershipId);
    if (!membership) {
      await this.unauthenticated(route);
      return null;
    }
    if (!this.modules.get(membership.organizationId)!.includes("Roster")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return membership;
  }

  /** Children a youth worker may read: those on the rosters of programs with a session they work. Null for everyone else. */
  private permittedChildren(m: Membership): Set<string> | null {
    if (!can.runSessions(m) || can.runAnySession(m)) return null;
    const programs = new Set(
      this.events
        .filter((e) => (this.sessionStaff.get(e.id) ?? []).includes(m.id))
        .map((e) => e.programId),
    );
    return new Set(
      this.programs.filter((p) => programs.has(p.id)).flatMap((p) => p.roster),
    );
  }

  private ownHousehold(m: Membership, id: string): FakeHousehold | undefined {
    return this.households.find(
      (h) => h.id === id && h.organizationId === m.organizationId,
    );
  }

  private ownChild(m: Membership, id: string) {
    for (const h of this.households.filter(
      (x) => x.organizationId === m.organizationId,
    )) {
      const child = h.children.find((c) => c.id === id);
      if (child) return { household: h, child };
    }
    return undefined;
  }

  private forbidden(route: Route): Promise<void> {
    return route.fulfill({ status: 403, json: { code: "forbidden" } });
  }

  private async listHouseholds(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const url = new URL(route.request().url());
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const filter = url.searchParams.get("filter");
    const permitted = this.permittedChildren(m);
    const rows = this.households
      .filter((h) => h.organizationId === m.organizationId)
      .filter((h) => !permitted || h.children.some((c) => permitted.has(c.id)))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((h) => {
        const children = h.children
          .filter((c) => !permitted || permitted.has(c.id))
          .sort(
            (a, b) =>
              (ageOf(a.dateOfBirth) ?? 99) - (ageOf(b.dateOfBirth) ?? 99),
          );
        const guardians = [...h.guardians].sort(
          (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
        );
        const summary = {
          id: h.id,
          name: h.name,
          primaryGuardian: guardians[0]?.name ?? null,
          children: children.map((c) =>
            ageOf(c.dateOfBirth) !== null
              ? `${c.firstName} (${ageOf(c.dateOfBirth)})`
              : c.firstName,
          ),
          language: h.language,
          medicalFlags: children.filter(hasMedicalFlag).length,
          missingInfo: !guardians.some(reachable),
        };
        const text = [
          h.name,
          ...guardians.map(
            (g) => `${g.name} ${g.mobile ?? ""} ${g.email ?? ""}`,
          ),
          ...children.map((c) => `${c.firstName} ${c.lastName}`),
        ]
          .join(" ")
          .toLowerCase();
        return { summary, text };
      });
    const counts = {
      all: rows.length,
      missingInfo: rows.filter((r) => r.summary.missingInfo).length,
      spanish: rows.filter((r) => r.summary.language === "Spanish").length,
      french: rows.filter((r) => r.summary.language === "French").length,
      children: rows.reduce((n, r) => n + r.summary.children.length, 0),
    };
    const households = rows
      .filter((r) => !q || r.text.includes(q))
      .filter((r) =>
        filter === "missing-info"
          ? r.summary.missingInfo
          : filter === "spanish"
            ? r.summary.language === "Spanish"
            : filter === "french"
              ? r.summary.language === "French"
              : true,
      )
      .map((r) => r.summary);
    return route.fulfill({ json: { households, counts } });
  }

  private async getHousehold(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const h = this.ownHousehold(m, id);
    if (!h) return route.fulfill({ status: 404 });
    const permitted = this.permittedChildren(m);
    const visible = h.children.filter((c) => !permitted || permitted.has(c.id));
    if (!visible.length && permitted) return this.forbidden(route);
    const medical = can.readMedical(m);
    return route.fulfill({
      json: {
        id: h.id,
        name: h.name,
        language: h.language,
        guardians: [...h.guardians]
          .sort(
            (a, b) =>
              Number(b.isPrimary) - Number(a.isPrimary) ||
              a.name.localeCompare(b.name),
          )
          .map(({ emailBounced: _, ...g }) => g),
        children: [...visible]
          .sort(
            (a, b) =>
              (ageOf(a.dateOfBirth) ?? 99) - (ageOf(b.dateOfBirth) ?? 99),
          )
          .map((c) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
            age: ageOf(c.dateOfBirth),
            school: c.school,
            medicalFlag: medical ? medicalFlag(c) : null,
          })),
        medicalRestricted: !medical,
      },
    });
  }

  private async createHousehold(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.writeHouseholds(m)) return this.forbidden(route);
    const body = route.request().postDataJSON() as {
      guardianName: string;
      mobile: string;
      email: string;
      language: string;
    };
    const errors: Record<string, string> = {};
    if (!body.guardianName?.trim())
      errors["guardianName"] = "Enter the guardian’s name.";
    if (!body.mobile?.trim() && !body.email?.trim())
      errors["mobile"] = "Enter a mobile number or an email.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const name = body.guardianName.trim();
    const last = name.includes(" ") ? name.slice(name.indexOf(" ") + 1) : name;
    const id = `hh-new-${this.nextId++}`;
    this.households.push({
      id,
      organizationId: m.organizationId,
      name: last,
      language: body.language,
      guardians: [
        {
          id: `g-new-${this.nextId++}`,
          name,
          relationship: "Guardian",
          mobile: body.mobile?.trim() || null,
          email: body.email?.trim() || null,
          language: body.language,
          isPrimary: true,
          canPickUp: true,
          canSign: true,
        },
      ],
      children: [],
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  private async addChild(route: Route, householdId: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.writeHouseholds(m)) return this.forbidden(route);
    const h = this.ownHousehold(m, householdId);
    if (!h) return route.fulfill({ status: 404 });
    const body = route.request().postDataJSON() as {
      name: string;
      dateOfBirth: string | null;
      school: string;
      allergies: string;
    };
    const errors: Record<string, string> = {};
    if (!body.name?.trim()) errors["name"] = "Enter the child’s name.";
    if (!body.dateOfBirth) errors["dateOfBirth"] = "Enter the date of birth.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const name = body.name.trim();
    const space = name.indexOf(" ");
    const id = `c-new-${this.nextId++}`;
    const allergies =
      body.allergies?.trim() && body.allergies.trim().toLowerCase() !== "none"
        ? body.allergies.trim()
        : null;
    h.children.push({
      id,
      firstName: space < 0 ? name : name.slice(0, space),
      lastName: space < 0 ? "" : name.slice(space + 1),
      dateOfBirth: body.dateOfBirth,
      school: body.school?.trim() || null,
      medical: {
        allergies,
        medication: null,
        conditions: null,
        doctor: null,
        redAlert: false,
        updatedAt: allergies ? "2026-11-05T21:12:00Z" : null,
        updatedBy: allergies ? m.personName : null,
      },
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  private async addGuardian(route: Route, householdId: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.writeHouseholds(m)) return this.forbidden(route);
    const h = this.ownHousehold(m, householdId);
    if (!h) return route.fulfill({ status: 404 });
    const body = route.request().postDataJSON() as {
      name: string;
      relationship: string;
      mobile: string;
      email: string;
      language: string;
      canPickUp: boolean;
      canSign: boolean;
    };
    const errors: Record<string, string> = {};
    if (!body.name?.trim()) errors["name"] = "Enter the guardian’s name.";
    if (!body.mobile?.trim() && !body.email?.trim())
      errors["mobile"] = "Enter a mobile number or an email.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const id = `g-new-${this.nextId++}`;
    h.guardians.push({
      id,
      name: body.name.trim(),
      relationship: body.relationship,
      mobile: body.mobile?.trim() || null,
      email: body.email?.trim() || null,
      language: body.language || h.language,
      isPrimary: false,
      canPickUp: body.canPickUp,
      canSign: body.canSign,
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  private async updateGuardian(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.writeHouseholds(m)) return this.forbidden(route);
    const g = this.households
      .filter((h) => h.organizationId === m.organizationId)
      .flatMap((h) => h.guardians)
      .find((x) => x.id === id);
    if (!g) return route.fulfill({ status: 404 });
    const body = route.request().postDataJSON() as {
      name: string;
      relationship: string;
      mobile: string;
      canPickUp: boolean;
      canSign: boolean;
    };
    if (!body.name?.trim())
      return route.fulfill({
        status: 422,
        json: { errors: { name: "Enter the guardian’s name." } },
      });
    Object.assign(g, {
      name: body.name.trim(),
      relationship: body.relationship,
      mobile: body.mobile?.trim() || null,
      canPickUp: body.canPickUp,
      canSign: body.canSign,
    });
    return route.fulfill({ status: 204 });
  }

  private async getChild(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const found = this.ownChild(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const { household, child } = found;
    if (this.permittedChildren(m)?.has(child.id) === false)
      return this.forbidden(route);
    const medical = can.readMedical(m);
    return route.fulfill({
      json: {
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        firstName: child.firstName,
        lastName: child.lastName,
        dateOfBirth: can.readDateOfBirth(m) ? child.dateOfBirth : null,
        age: ageOf(child.dateOfBirth),
        school: child.school,
        householdId: household.id,
        householdName: household.name,
        medical: medical ? child.medical : null,
        medicalRestricted: !medical,
      },
    });
  }

  private async updateChild(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.writeHouseholds(m)) return this.forbidden(route);
    const found = this.ownChild(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const body = route.request().postDataJSON() as {
      name: string;
      dateOfBirth: string | null;
      school: string;
    };
    const errors: Record<string, string> = {};
    if (!body.name?.trim()) errors["name"] = "Enter the child’s name.";
    if (!body.dateOfBirth) errors["dateOfBirth"] = "Enter the date of birth.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const name = body.name.trim();
    const space = name.indexOf(" ");
    Object.assign(found.child, {
      firstName: space < 0 ? name : name.slice(0, space),
      lastName: space < 0 ? "" : name.slice(space + 1),
      dateOfBirth: body.dateOfBirth,
      school: body.school?.trim() || null,
    });
    return route.fulfill({ status: 204 });
  }

  private async updateMedical(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.writeMedical(m)) return this.forbidden(route);
    const found = this.ownChild(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const body = route.request().postDataJSON() as {
      allergies: string;
      medication: string;
      conditions: string;
      doctor: string;
      redAlert: boolean;
      alertInstruction: string;
    };
    const clean = (v: string) => v?.trim() || null;
    found.child.medical = {
      allergies: clean(body.allergies),
      medication: clean(body.medication),
      conditions: clean(body.conditions),
      doctor: clean(body.doctor),
      redAlert: body.redAlert,
      alertInstruction: clean(body.alertInstruction),
      healthCard: found.child.medical.healthCard ?? null,
      updatedAt: "2026-11-05T21:12:00Z",
      updatedBy: m.personName,
    };
    return route.fulfill({ status: 204 });
  }

  private async deleteHousehold(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.deleteHouseholds(m)) return this.forbidden(route);
    const h = this.ownHousehold(m, id);
    if (!h) return route.fulfill({ status: 404 });
    const body = route.request().postDataJSON() as {
      reason: string;
      confirmName: string;
    };
    if (body.confirmName?.trim().toLowerCase() !== h.name.toLowerCase()) {
      return route.fulfill({
        status: 422,
        json: { errors: { confirmName: `Type ${h.name} to confirm.` } },
      });
    }
    this.households = this.households.filter((x) => x !== h);
    return route.fulfill({ status: 204 });
  }

  private childrenOf(m: Membership) {
    return this.households
      .filter((h) => h.organizationId === m.organizationId)
      .flatMap((h) => h.children.map((c) => ({ child: c, household: h })));
  }

  private async findChildren(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const q = (new URL(route.request().url()).searchParams.get("q") ?? "")
      .trim()
      .toLowerCase();
    const children = !q
      ? []
      : this.childrenOf(m)
          .filter(
            ({ child }) => this.permittedChildren(m)?.has(child.id) !== false,
          )
          .filter(({ child }) =>
            `${child.firstName} ${child.lastName}`.toLowerCase().includes(q),
          )
          .map(({ child, household }) => ({
            id: child.id,
            name: `${child.firstName} ${child.lastName}`,
            age: ageOf(child.dateOfBirth),
            householdId: household.id,
            householdName: household.name,
          }));
    return route.fulfill({ json: { children } });
  }

  private ownProgram(m: Membership, id: string): FakeProgram | undefined {
    return this.programs.find(
      (p) => p.id === id && p.organizationId === m.organizationId,
    );
  }

  private async listPrograms(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const status =
      new URL(route.request().url()).searchParams.get("status") === "archived"
        ? "Archived"
        : "Active";
    const own = this.programs
      .filter((p) => p.organizationId === m.organizationId)
      .sort(
        (a, b) =>
          a.startsOn.localeCompare(b.startsOn) || a.name.localeCompare(b.name),
      );
    const active = own.filter((p) => p.status === "Active");
    return route.fulfill({
      json: {
        programs: own
          .filter((p) => p.status === status)
          .map((p) => ({
            id: p.id,
            name: p.name,
            schedule: p.schedule,
            startsOn: p.startsOn,
            endsOn: p.endsOn,
            enrolled: p.roster.length,
            capacity: p.capacity,
            enrollmentOpen: p.enrollmentOpen,
            status: p.status,
            term: p.term,
          })),
        active: active.length,
        archived: own.length - active.length,
        enrolled: active.reduce((n, p) => n + p.roster.length, 0),
      },
    });
  }

  private async getProgram(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const p = this.ownProgram(m, id);
    if (!p) return route.fulfill({ status: 404 });
    const children = this.childrenOf(m);
    const roster = p.roster
      .map((cid) => children.find((x) => x.child.id === cid))
      .filter((x) => !!x)
      .sort(
        (a, b) =>
          a!.child.lastName.localeCompare(b!.child.lastName) ||
          a!.child.firstName.localeCompare(b!.child.firstName),
      )
      .map((x) => ({
        id: x!.child.id,
        householdId: x!.household.id,
        name: `${x!.child.firstName} ${x!.child.lastName}`,
        age: ageOf(x!.child.dateOfBirth),
        householdName: x!.household.name,
      }));
    const { roster: _, organizationId: __, ...rest } = p;
    const slug = this.enrollmentSlugs.get(p.id);
    return route.fulfill({
      json: {
        ...rest,
        enrollmentUrl: slug ? `http://localhost:4317/g/enroll/${slug}` : null,
        pendingReviews: this.enrollmentRequests.filter(
          (r) => r.programId === p.id && r.status === "WaitingReview",
        ).length,
        waitlisted: this.enrollmentRequests.filter(
          (r) => r.programId === p.id && r.status === "Waitlisted",
        ).length,
        enrolled: roster.length,
        roster,
        events: this.events
          .filter((e) => e.programId === p.id)
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
          .map((e) => ({
            id: e.id,
            name: e.name,
            startsAt: e.startsAt,
            endsAt: e.endsAt,
            status: e.status,
          })),
      },
    });
  }

  private async saveProgram(route: Route, id: string | null): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    const existing = id ? this.ownProgram(m, id) : undefined;
    if (id && !existing) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      name: string;
      startsOn: string | null;
      endsOn: string | null;
      schedule: string;
      capacity: number;
      ages: string;
      enrollmentOpen: boolean;
      seasonConsent: boolean;
      term?: string | null;
    };
    const errors: Record<string, string> = {};
    if (!b.name?.trim()) errors["name"] = "Enter the program name.";
    if (!b.startsOn) errors["startsOn"] = "Enter the start date.";
    if (!b.endsOn) errors["endsOn"] = "Enter the end date.";
    else if (b.startsOn && b.endsOn < b.startsOn)
      errors["endsOn"] = "End after it starts.";
    if (!(b.capacity >= 1))
      errors["capacity"] = "Enter a capacity of 1 or more.";
    if ((b.term?.trim().length ?? 0) > 40)
      errors["term"] = "Keep the term under 40 characters.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const values = {
      name: b.name.trim(),
      startsOn: b.startsOn!,
      endsOn: b.endsOn!,
      schedule: b.schedule?.trim() || null,
      capacity: b.capacity,
      ages: b.ages?.trim() || null,
      enrollmentOpen: b.enrollmentOpen,
      seasonConsent: b.seasonConsent,
      term: b.term?.trim() || null,
    };
    if (existing) {
      Object.assign(existing, values);
      return route.fulfill({ status: 204 });
    }
    const newId = `p-new-${this.nextId++}`;
    this.programs.push({
      id: newId,
      organizationId: m.organizationId,
      ...values,
      status: "Active",
      archivedAt: null,
      archivedBy: null,
      roster: [],
    });
    return route.fulfill({ status: 201, json: { id: newId } });
  }

  private async archiveProgram(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    const p = this.ownProgram(m, id);
    if (!p) return route.fulfill({ status: 404 });
    const { confirmName } = route.request().postDataJSON() as {
      confirmName: string;
    };
    if (confirmName?.trim().toLowerCase() !== p.name.toLowerCase()) {
      return route.fulfill({
        status: 422,
        json: { errors: { confirmName: `Type ${p.name} to confirm.` } },
      });
    }
    Object.assign(p, {
      status: "Archived",
      enrollmentOpen: false,
      archivedAt: NOW.toISOString(),
      archivedBy: m.personName,
    });
    return route.fulfill({ status: 204 });
  }

  private async restoreProgram(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    const p = this.ownProgram(m, id);
    if (!p) return route.fulfill({ status: 404 });
    Object.assign(p, { status: "Active", archivedAt: null, archivedBy: null });
    return route.fulfill({ status: 204 });
  }

  private async enroll(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    const p = this.ownProgram(m, id);
    if (!p) return route.fulfill({ status: 404 });
    const { childId } = route.request().postDataJSON() as { childId: string };
    const found = this.childrenOf(m).find((x) => x.child.id === childId);
    const invalid = (message: string) =>
      route.fulfill({ status: 422, json: { errors: { childId: message } } });
    if (!found) return invalid("Choose a child from your roster.");
    if (p.status === "Archived") return invalid(`${p.name} is archived.`);
    if (p.roster.includes(childId))
      return invalid(
        `${found.child.firstName} ${found.child.lastName} is already enrolled.`,
      );
    if (p.roster.length >= p.capacity)
      return invalid(
        `${p.name} is full (${p.roster.length} of ${p.capacity}).`,
      );
    p.roster.push(childId);
    return route.fulfill({ status: 201, json: { id: `en-${this.nextId++}` } });
  }

  private async unenroll(
    route: Route,
    id: string,
    childId: string,
  ): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    const p = this.ownProgram(m, id);
    if (!p || !p.roster.includes(childId))
      return route.fulfill({ status: 404 });
    p.roster = p.roster.filter((c) => c !== childId);
    return route.fulfill({ status: 204 });
  }

  /** Roles that run sessions without running any session (youth workers, volunteers) open only the ones they are assigned to; a mentor also the sessions of the cohorts on his team (ADR 0065). */
  private mayRun(m: Membership, eventId: string): boolean {
    if (
      !can.runSessions(m) ||
      can.runAnySession(m) ||
      (this.sessionStaff.get(eventId) ?? []).includes(m.id)
    )
      return true;
    if (m.role !== "Mentor") return false;
    const e = this.events.find((x) => x.id === eventId);
    const team = e && this.cohortMentors.get(e.programId);
    const program = e && this.programs.find((p) => p.id === e.programId);
    return (
      !!team &&
      program?.status !== "Archived" &&
      (team.lead === m.id || team.supporting.includes(m.id))
    );
  }

  private ownEvent(m: Membership, id: string): FakeEvent | undefined {
    return this.events.find(
      (e) => e.id === id && e.organizationId === m.organizationId,
    );
  }

  private eventSummary(e: FakeEvent) {
    const p = this.programs.find((x) => x.id === e.programId)!;
    return {
      id: e.id,
      name: e.name,
      programId: p.id,
      programName: p.name,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      place: e.place,
      rosterSize: p.roster.length,
      slipStatus: e.slipStatus,
      status: e.status,
    };
  }

  private async listEvents(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const url = new URL(route.request().url());
    const filter = url.searchParams.get("filter");
    const programId = url.searchParams.get("programId");
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const now = NOW.toISOString();
    const own = this.events.filter(
      (e) => e.organizationId === m.organizationId,
    );
    const upcoming = own
      .filter((e) => e.endsAt >= now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const needSlips = upcoming.filter(
      (e) => e.status === "Scheduled" && e.slipStatus === "Draft",
    );
    const chosen =
      filter === "past"
        ? own
            .filter((e) => e.endsAt < now)
            .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
        : filter === "needs-slips"
          ? needSlips
          : upcoming;
    const events = chosen
      .map((e) => this.eventSummary(e))
      .filter((e) => !programId || e.programId === programId)
      .filter(
        (e) =>
          !q ||
          `${e.name} ${e.programName} ${e.place ?? ""}`
            .toLowerCase()
            .includes(q),
      );
    return route.fulfill({
      json: { events, upcoming: upcoming.length, needSlips: needSlips.length },
    });
  }

  /** The month's events by Hamilton calendar day, optionally of one program (L2-093). Mirrors EventCalendarHandler. */
  private async eventCalendar(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.useStaffApp(m)) return this.forbidden(route);
    const url = new URL(route.request().url());
    const today = hamiltonDay(NOW.toISOString());
    const month = url.searchParams.get("month") || today.slice(0, 7);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
      return route.fulfill({
        status: 422,
        json: { errors: { month: "Choose a month." } },
      });
    const programId = url.searchParams.get("programId");
    const events = this.events
      .filter(
        (e) =>
          e.organizationId === m.organizationId &&
          (!programId || e.programId === programId),
      )
      .map((e) => ({ e, day: hamiltonDay(e.startsAt) }))
      .filter(({ day }) => day.startsWith(month))
      .sort(
        (a, b) =>
          a.e.startsAt.localeCompare(b.e.startsAt) ||
          a.e.name.localeCompare(b.e.name),
      )
      .map(({ e, day }) => {
        const s = this.eventSummary(e);
        return {
          id: e.id,
          name: e.name,
          programId: s.programId,
          programName: s.programName,
          day,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          place: e.place,
          status: e.status,
        };
      });
    return route.fulfill({ json: { month, today, events } });
  }

  /** The caller for the youth's schedule (L2-094): Roster on, a youth, and guardian consent in force when she needs it (L2-056). */
  private async scheduleCaller(route: Route): Promise<Membership | null> {
    const m = await this.participantModuleCaller(
      route,
      "Roster",
      can.respondToSessions,
    );
    if (!m) return null;
    const childId = this.youthLinks.get(m.id);
    if (
      childId &&
      this.consentRequired(m.organizationId, childId) &&
      this.consentStatusName(childId) !== "Given"
    ) {
      await route.fulfill({
        status: 403,
        json: {
          code: "consent-required",
          consentAge: this.consentPolicyOf(m.organizationId).consentAge,
        },
      });
      return null;
    }
    return m;
  }

  /** GET /schedule: her sessions in the next 28 days that have not started, with her answers. Mirrors YouthScheduleHandler. */
  private async youthSchedule(route: Route): Promise<void> {
    const m = await this.scheduleCaller(route);
    if (!m) return;
    const childId = this.youthLinks.get(m.id);
    const programs = this.placementsOf(m);
    const now = NOW.toISOString();
    const until = new Date(NOW.getTime() + 28 * 86_400_000).toISOString();
    const sessions = this.events
      .filter(
        (e) =>
          programs.some((p) => p.id === e.programId) &&
          e.startsAt > now &&
          e.startsAt <= until,
      )
      .sort(
        (a, b) =>
          a.startsAt.localeCompare(b.startsAt) || a.name.localeCompare(b.name),
      )
      .map((e) => {
        const answer = this.rsvps.find(
          (r) => r.eventId === e.id && r.childId === childId,
        );
        return {
          eventId: e.id,
          name: e.name,
          programName: programs.find((p) => p.id === e.programId)!.name,
          day: hamiltonDay(e.startsAt),
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          place: e.place,
          status: e.status,
          response: answer?.response ?? null,
          note: answer?.note ?? null,
        };
      });
    return route.fulfill({ json: { sessions } });
  }

  /** PUT /schedule/{eventId}/rsvp. Mirrors RsvpHandler. */
  private async rsvp(route: Route, eventId: string): Promise<void> {
    const m = await this.scheduleCaller(route);
    if (!m) return;
    const e = this.ownEvent(m, eventId);
    if (!e) return route.fulfill({ status: 404 });
    const childId = this.youthLinks.get(m.id);
    if (!childId || !this.placementsOf(m).some((p) => p.id === e.programId)) {
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "AccessDenied",
        record: "Event",
        summary: `${m.personName} tried to RSVP to ${e.name}`,
        device: null,
      });
      return this.forbidden(route);
    }
    if (e.status !== "Scheduled" || e.startsAt <= NOW.toISOString())
      return route.fulfill({ status: 409, json: { code: "rsvp-closed" } });
    const b = route.request().postDataJSON() as {
      response?: string | null;
      note?: string | null;
    };
    const errors: Record<string, string> = {};
    if (!["Going", "Maybe", "CantMake"].includes(b.response ?? ""))
      errors["response"] = "Choose whether you’re going.";
    const note = b.note?.trim() || null;
    if (note && note.length > 500)
      errors["note"] = "Keep it to 500 characters.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const response = b.response as FakeRsvp["response"];
    const existing = this.rsvps.find(
      (r) => r.eventId === e.id && r.childId === childId,
    );
    if (existing)
      Object.assign(existing, {
        response,
        note,
        answeredAt: NOW.toISOString(),
      });
    else
      this.rsvps.push({
        eventId: e.id,
        childId,
        response,
        note,
        answeredAt: NOW.toISOString(),
      });
    return route.fulfill({ json: { response, note } });
  }

  private async getEvent(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
    const { organizationId: _, ...rest } = e;
    const { seriesId, ...detail } = rest;
    const seriesSize = seriesId
      ? this.events.filter((x) => x.seriesId === seriesId).length
      : null;
    return route.fulfill({
      json: {
        ...detail,
        programName: this.eventSummary(e).programName,
        rosterSize: this.eventSummary(e).rosterSize,
        seriesSize,
        rsvps: this.rsvpSummary(e),
      },
    });
  }

  /** A session's RSVPs for staff (L2-094 criterion 4). Mirrors EventRsvpSummary. */
  private rsvpSummary(e: FakeEvent) {
    const answers = this.rsvps.filter((r) => r.eventId === e.id);
    const roster =
      this.programs.find((p) => p.id === e.programId)?.roster ?? [];
    const signIn = [...this.youthLinks.entries()]
      .filter(
        ([membershipId, childId]) =>
          roster.includes(childId) &&
          memberships.some(
            (m) =>
              m.id === membershipId && m.organizationId === e.organizationId,
          ),
      )
      .map(([, childId]) => childId);
    const nameOf = (childId: string) => {
      const c = this.households
        .flatMap((h) => h.children)
        .find((x) => x.id === childId);
      return c ? `${c.firstName} ${c.lastName}` : "";
    };
    return {
      going: answers.filter((a) => a.response === "Going").length,
      maybe: answers.filter((a) => a.response === "Maybe").length,
      cantMake: answers.filter((a) => a.response === "CantMake").length,
      noReply: signIn.filter((id) => !answers.some((a) => a.childId === id))
        .length,
      responses: [...answers]
        .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
        .map((a) => ({
          childId: a.childId,
          childName: nameOf(a.childId),
          response: a.response,
          note: a.note,
          answeredAt: a.answeredAt,
        })),
    };
  }

  private async saveEvent(route: Route, id: string | null): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.manageEvents(m)) return this.forbidden(route);
    const existing = id ? this.ownEvent(m, id) : undefined;
    if (id && !existing) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      name: string;
      programId: string;
      startsAt: string | null;
      endsAt: string | null;
      place: string;
      requiresSlip: boolean;
      noShowAlert: boolean;
      staffNotes: string;
      repeatsWeekly?: boolean;
    };
    const errors: Record<string, string> = {};
    if (!b.name?.trim()) errors["name"] = "Enter the event name.";
    const program = this.ownProgram(m, b.programId);
    if (!program || program.status !== "Active")
      errors["programId"] = "Choose an active program.";
    if (!b.startsAt) errors["startsAt"] = "Enter when it starts.";
    if (!b.endsAt) errors["endsAt"] = "Enter when it ends.";
    else if (b.startsAt && new Date(b.endsAt) <= new Date(b.startsAt))
      errors["endsAt"] = "End after it starts.";
    // Repeat weekly applies only when creating: one session a week through the program's last day, at most 60 (L2-093, mirrors EventRules).
    const weekly = !id && !!b.repeatsWeekly && !!program && !!b.startsAt;
    const starts = weekly
      ? weeklyStarts(new Date(b.startsAt!).toISOString(), program!.endsOn)
      : [];
    if (weekly && starts.length === 0) {
      const last = new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
        .format(new Date(`${program!.endsOn}T12:00:00Z`))
        .replace(",", "");
      errors["startsAt"] =
        `Start on or before the program’s last day, ${last}.`;
    } else if (starts.length > 60)
      errors["repeatsWeekly"] = "A weekly series can have at most 60 sessions.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const values = {
      name: b.name.trim(),
      programId: b.programId,
      startsAt: new Date(b.startsAt!).toISOString(),
      endsAt: new Date(b.endsAt!).toISOString(),
      place: b.place?.trim() || null,
      requiresSlip: b.requiresSlip,
      noShowAlert: b.noShowAlert,
      staffNotes: b.staffNotes?.trim() || null,
    };
    if (existing) {
      Object.assign(existing, values, {
        slipStatus: values.requiresSlip
          ? existing.slipStatus === "NotNeeded"
            ? "Draft"
            : existing.slipStatus
          : "NotNeeded",
      });
      return route.fulfill({ status: 204 });
    }
    const length =
      new Date(values.endsAt).getTime() - new Date(values.startsAt).getTime();
    const seriesId = weekly ? `series-${this.nextId++}` : null;
    const ids = (weekly ? starts : [values.startsAt]).map((startsAt) => {
      const newId = `e-new-${this.nextId++}`;
      this.events.push({
        id: newId,
        organizationId: m.organizationId,
        ...values,
        startsAt,
        endsAt: new Date(new Date(startsAt).getTime() + length).toISOString(),
        status: "Scheduled",
        slipStatus: values.requiresSlip ? "Draft" : "NotNeeded",
        cancelledAt: null,
        cancelledBy: null,
        cancellationMessage: null,
        guardiansTold: false,
        seriesId,
      });
      return newId;
    });
    return route.fulfill({
      status: 201,
      json: { id: ids[0], count: ids.length },
    });
  }

  private async cancelEvent(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.cancelEvents(m)) return this.forbidden(route);
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      message: string;
      tellGuardians: boolean;
    };
    if (b.tellGuardians && !b.message?.trim())
      return route.fulfill({
        status: 422,
        json: { errors: { message: "Write the message to guardians." } },
      });
    Object.assign(e, {
      status: "Cancelled",
      cancelledAt: NOW.toISOString(),
      cancelledBy: m.personName,
      cancellationMessage: b.message?.trim() || null,
      guardiansTold: b.tellGuardians,
    });
    return route.fulfill({ status: 204 });
  }

  /** The signed-in membership when Roll Call is on for its organization. */
  private async rollCallCaller(route: Route): Promise<Membership | null> {
    const membership = memberships.find((m) => m.id === this.membershipId);
    if (!membership) {
      await this.unauthenticated(route);
      return null;
    }
    if (!this.modules.get(membership.organizationId)!.includes("RollCall")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return membership;
  }

  private sessionRecords(eventId: string): Map<string, FakeAttendance> {
    if (!this.attendance.has(eventId)) this.attendance.set(eventId, new Map());
    return this.attendance.get(eventId)!;
  }

  private sessionSummary(e: FakeEvent) {
    const p = this.programs.find((x) => x.id === e.programId)!;
    const records = this.sessionRecords(e.id);
    const walkIns = this.walkIns.filter((w) => w.eventId === e.id);
    const ids = [...p.roster, ...walkIns.map((w) => w.id)];
    const checkedIn = ids.filter((id) =>
      ["Present", "SignedOut"].includes(records.get(id)?.status ?? ""),
    ).length;
    const absent = ids.filter(
      (id) => records.get(id)?.status === "Absent",
    ).length;
    const late = ids.filter(
      (id) =>
        ["Present", "SignedOut"].includes(records.get(id)?.status ?? "") &&
        records.get(id)?.late,
    ).length;
    const excused = ids.filter(
      (id) => records.get(id)?.status === "Absent" && records.get(id)?.excused,
    ).length;
    return {
      id: e.id,
      name: e.name,
      programId: p.id,
      programName: p.name,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      place: e.place,
      expected: ids.length,
      checkedIn,
      absent,
      notYet: ids.length - checkedIn - absent,
      late,
      excused,
      status: e.status,
      endedAt: e.endedAt ?? null,
      endedBy: e.endedBy ?? null,
      notes: e.notes ?? null,
    };
  }

  private async todaySessions(route: Route): Promise<void> {
    const m = await this.rollCallCaller(route);
    if (!m) return;
    // "Today" is 5 November 2026 in Hamilton: 05:00Z to the next 05:00Z.
    const start = "2026-11-05T05:00:00.000Z";
    const end = "2026-11-06T05:00:00.000Z";
    const sessions = this.events
      .filter(
        (e) =>
          e.organizationId === m.organizationId &&
          e.status === "Scheduled" &&
          e.startsAt < end &&
          e.endsAt > start,
      )
      .filter((e) => this.mayRun(m, e.id))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map((e) => this.sessionSummary(e));
    return route.fulfill({ json: { sessions } });
  }

  /** GET /sessions/mine (L2-101): the sessions the caller is assigned to that have not ended and start within 28 days. Mirrors MyScheduleHandler. */
  private async mySchedule(route: Route): Promise<void> {
    const m = await this.rollCallCaller(route);
    if (!m) return;
    if (!can.runSessions(m)) return this.forbidden(route);
    const now = NOW.toISOString();
    const until = new Date(NOW.getTime() + 28 * 86_400_000).toISOString();
    const today = hamiltonDay(now);
    const sessions = this.events
      .filter(
        (e) =>
          e.organizationId === m.organizationId &&
          (this.sessionStaff.get(e.id) ?? []).includes(m.id),
      )
      .filter((e) => e.endsAt > now && e.startsAt <= until)
      .sort(
        (a, b) =>
          a.startsAt.localeCompare(b.startsAt) || a.name.localeCompare(b.name),
      )
      .map((e) => {
        const summary = this.sessionSummary(e);
        return {
          id: e.id,
          name: e.name,
          programName: summary.programName,
          day: hamiltonDay(e.startsAt),
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          place: e.place,
          expected: summary.expected,
          status: e.status,
          today: hamiltonDay(e.startsAt) === today,
        };
      });
    return route.fulfill({ json: { sessions } });
  }

  private async sessionRoster(route: Route, id: string): Promise<void> {
    const m = await this.rollCallCaller(route);
    if (!m) return;
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
    if (!this.mayRun(m, e.id)) return this.forbidden(route);
    const p = this.programs.find((x) => x.id === e.programId)!;
    const records = this.sessionRecords(e.id);
    const children = this.childrenOf(m)
      .filter(({ child }) => p.roster.includes(child.id))
      .map(({ child, household }) => ({
        id: child.id,
        childId: child.id,
        householdId: household.id,
        name: `${child.firstName} ${child.lastName}`,
        age: ageOf(child.dateOfBirth),
        school: child.school,
        medicalFlag: can.readMedical(m) ? medicalFlag(child) : null,
        status: records.get(child.id)?.status ?? "NotYet",
        checkedInAt: records.get(child.id)?.checkedInAt ?? null,
        walkIn: false,
        signedOutAt: records.get(child.id)?.signedOutAt ?? null,
        collectedBy: records.get(child.id)?.collectedBy ?? null,
        conflict: this.conflicts.has(`${e.id}:${child.id}`),
        late: records.get(child.id)?.late ?? false,
        excused: records.get(child.id)?.excused ?? false,
        noShow: this.noShows.get(`${e.id}:${child.id}`)?.state ?? null,
        noShowAt: this.noShows.get(`${e.id}:${child.id}`)?.at ?? null,
      }));
    const walkIns = this.walkIns
      .filter((w) => w.eventId === e.id)
      .map((w) => ({
        id: w.id,
        childId: null,
        householdId: null,
        name: w.childName,
        age: null,
        school: null,
        medicalFlag:
          can.readMedical(m) && w.medicalNotes ? "Medical note" : null,
        status: records.get(w.id)?.status ?? "NotYet",
        checkedInAt: records.get(w.id)?.checkedInAt ?? null,
        walkIn: true,
        signedOutAt: records.get(w.id)?.signedOutAt ?? null,
        collectedBy: records.get(w.id)?.collectedBy ?? null,
        late: records.get(w.id)?.late ?? false,
        excused: records.get(w.id)?.excused ?? false,
      }));
    return route.fulfill({
      json: {
        session: this.sessionSummary(e),
        children: [...children, ...walkIns].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      },
    });
  }

  private async runnableSession(route: Route, id: string) {
    const m = await this.rollCallCaller(route);
    if (!m) return null;
    if (!can.runSessions(m)) {
      await this.forbidden(route);
      return null;
    }
    const e = this.ownEvent(m, id);
    if (!e) {
      await route.fulfill({ status: 404 });
      return null;
    }
    if (!this.mayRun(m, e.id)) {
      await this.forbidden(route);
      return null;
    }
    return { m, e };
  }

  private async endSession(route: Route, id: string): Promise<void> {
    const found = await this.runnableSession(route, id);
    if (!found) return;
    const { m, e } = found;
    if (e.status !== "Scheduled")
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const b = route.request().postDataJSON() as {
      notCheckedIn: "MarkAbsent" | "LeaveNotRecorded";
      notSignedOut: "SignOutAtEnd" | "LeaveUnsigned";
    };
    const records = this.sessionRecords(e.id);
    const p = this.programs.find((x) => x.id === e.programId)!;
    for (const childId of p.roster) {
      const r = records.get(childId);
      if ((!r || r.status === "NotYet") && b.notCheckedIn === "MarkAbsent")
        records.set(childId, { status: "Absent", checkedInAt: null });
      else if (r?.status === "Present" && b.notSignedOut === "SignOutAtEnd")
        records.set(childId, {
          ...r,
          status: "SignedOut",
          signedOutAt: e.endsAt,
          collectedBy: "A guardian, at the end of the session",
        });
    }
    Object.assign(e, {
      status: "Ended",
      endedAt: NOW.toISOString(),
      endedBy: m.personName,
    });
    return route.fulfill({ json: this.sessionSummary(e) });
  }

  private async sessionNotes(route: Route, id: string): Promise<void> {
    const found = await this.runnableSession(route, id);
    if (!found) return;
    const b = route.request().postDataJSON() as { notes: string | null };
    found.e.notes = b.notes?.trim() || null;
    return route.fulfill({ status: 204 });
  }

  private async attend(
    route: Route,
    id: string,
    status: "Present" | "Absent",
  ): Promise<void> {
    const m = await this.rollCallCaller(route);
    if (!m) return;
    if (!can.runSessions(m)) return this.forbidden(route);
    const b = route.request().postDataJSON() as {
      childId: string;
      arrivedAt?: string | null;
      clientActionId: string;
      late?: boolean;
      excused?: boolean;
    };
    // Volunteers mark Present or Absent only (L2-100, ADR 0066). Mirrors CheckInHandler and MarkAbsentHandler.
    if ((b.late || b.excused) && !can.qualifyAttendance(m))
      return this.forbidden(route);
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
    if (!this.mayRun(m, e.id)) return this.forbidden(route);
    if (this.actions.has(b.clientActionId))
      return route.fulfill({ json: { status: "saved" } });
    if (e.status === "Cancelled")
      return route.fulfill({
        status: 422,
        json: { errors: { session: "This session is cancelled." } },
      });
    if (e.status === "Ended")
      return route.fulfill({
        status: 422,
        json: { errors: { session: "This session has ended." } },
      });
    const p = this.programs.find((x) => x.id === e.programId)!;
    if (!p.roster.includes(b.childId)) {
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            childId:
              "This child is not on tonight’s roster. Add a walk-in instead.",
          },
        },
      });
    }
    this.actions.add(b.clientActionId);
    this.sessionRecords(e.id).set(b.childId, {
      status,
      checkedInAt:
        status === "Present" ? (b.arrivedAt ?? NOW.toISOString()) : null,
      late: status === "Present" && !!b.late,
      excused: status === "Absent" && !!b.excused,
    });
    return route.fulfill({ json: { status: "saved" } });
  }

  private async addWalkIn(route: Route, id: string): Promise<void> {
    const m = await this.rollCallCaller(route);
    if (!m) return;
    if (!can.runSessions(m)) return this.forbidden(route);
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
    if (!this.mayRun(m, e.id)) return this.forbidden(route);
    const b = route.request().postDataJSON() as {
      childName: string;
      guardian: string;
      medicalNotes: string;
    };
    const errors: Record<string, string> = {};
    if (!b.childName?.trim()) errors["childName"] = "Enter the child’s name.";
    if (!b.guardian?.trim())
      errors["guardian"] = "Enter the guardian’s name and phone.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const walkIn = {
      id: `w-${this.nextId++}`,
      eventId: e.id,
      childName: b.childName.trim(),
      guardian: b.guardian.trim(),
      medicalNotes: b.medicalNotes?.trim() || null,
    };
    this.walkIns.push(walkIn);
    this.sessionRecords(e.id).set(walkIn.id, {
      status: "Present",
      checkedInAt: NOW.toISOString(),
    });
    return route.fulfill({ status: 201, json: { id: walkIn.id } });
  }

  /** Pickup needs Roll Call, so the caller must pass both module checks. */
  private async pickupCaller(route: Route): Promise<Membership | null> {
    const m = await this.rollCallCaller(route);
    if (!m) return null;
    if (!this.modules.get(m.organizationId)!.includes("Pickup")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return m;
  }

  private sortedGuardians(household: FakeHousehold): FakeGuardian[] {
    return [...household.guardians].sort(
      (a, b) =>
        Number(b.isPrimary) - Number(a.isPrimary) ||
        a.name.localeCompare(b.name),
    );
  }

  private async pickups(route: Route, id: string): Promise<void> {
    const m = await this.pickupCaller(route);
    if (!m) return;
    const found = this.ownChild(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const guardians = this.sortedGuardians(found.household);
    return route.fulfill({
      json: {
        childId: found.child.id,
        childName: `${found.child.firstName} ${found.child.lastName}`,
        primaryName: guardians[0]?.name ?? null,
        primaryPhone: guardians[0]?.mobile ?? null,
        approved: [
          ...guardians
            .filter((g) => g.canPickUp)
            .map((g) => ({
              guardianId: g.id,
              name: g.name,
              relationship: g.relationship,
              isPrimary: g.isPrimary,
              pickupId: null,
            })),
          ...this.activePickups(found.child.id).map((x) => ({
            guardianId: null,
            name: x.name,
            relationship: x.relationship,
            isPrimary: false,
            pickupId: x.id,
          })),
        ],
      },
    });
  }

  /** An adult already approved besides the guardians (seeded as the API would store it). */
  approvePickup(childId: string, name: string, relationship = "Aunt"): string {
    const household = this.households.find((h) =>
      h.children.some((c) => c.id === childId),
    )!;
    const id = `pu-${this.nextId++}`;
    this.extraPickups.push({
      id,
      childId,
      householdId: household.id,
      name,
      relationship,
      removed: false,
    });
    return id;
  }

  private async adminCaller(route: Route): Promise<Membership | null> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      await this.unauthenticated(route);
      return null;
    }
    if (m.role !== "Admin") {
      await this.forbidden(route);
      return null;
    }
    return m;
  }

  private staffOf(m: Membership) {
    return memberships.filter(
      (x) =>
        x.organizationId === m.organizationId && !this.removedMembers.has(x.id),
    );
  }

  /** An emailed invitation for this test, reachable at /invite/{token}; expired ones answer 410. */
  sentInvitation(
    token: string,
    email: string,
    role = "YouthWorker",
    expired = false,
    youth: { childId: string; suggestedName: string } | null = null,
  ): void {
    this.invitationLinks.set(token, {
      email,
      role,
      expired,
      accepted: false,
      childId: youth?.childId ?? null,
      suggestedName: youth?.suggestedName ?? null,
    });
  }

  /** An admin withdrew this emailed invitation; its link answers 410 "withdrawn". */
  withdrawLink(token: string): void {
    this.invitationLinks.get(token)!.withdrawn = true;
  }

  /** An invitation on Harbourview's Staff and roles, as an admin sent it; expired ones stay listed to resend (L2-052). */
  pendingInvitation(i: {
    email: string;
    role: string;
    childName?: string;
    expired?: boolean;
    replacementRequested?: boolean;
  }): void {
    this.invitations.push({
      id: `inv-${this.nextId++}`,
      organizationId: "org-harbourview",
      invitedBy: "Tom Nguyen",
      withdrawn: false,
      ...i,
    });
  }

  /** The child a youth account made by accepting an invitation links to, by its email. */
  youthLinkOf(email: string): string | undefined {
    const m = memberships.find((x) => x.email === email);
    return m ? this.youthLinks.get(m.id) : undefined;
  }

  /** The phone number the new worker saved during onboarding, if any. */
  savedPhone: string | null = null;

  private async getInvitation(route: Route, token: string): Promise<void> {
    const i = this.invitationLinks.get(token);
    const reason = this.goneReason(i);
    if (reason)
      return route.fulfill({
        status: 410,
        json: {
          reason,
          invitedBy: i ? "Tom Nguyen" : null,
          organization: i ? "Harbourview Youth Collective" : null,
        },
      });
    return route.fulfill({
      json: {
        email: i!.email,
        organization: "Harbourview Youth Collective",
        role: i!.role,
        invitedBy: "Tom Nguyen",
        suggestedName: i!.suggestedName,
      },
    });
  }

  /** Anonymous: only an expired link may ask, and asking twice records once (L2-054). */
  private async requestNewLink(route: Route, token: string): Promise<void> {
    if (this.goneReason(this.invitationLinks.get(token)) !== "expired")
      return route.fulfill({ status: 404 });
    if (!this.newLinkRequests.includes(token)) this.newLinkRequests.push(token);
    return route.fulfill({ status: 202 });
  }

  /** Why a link no longer works, as the server answers it (L2-052, L2-054); an unknown token reads as used. */
  private goneReason(
    i: { expired: boolean; accepted: boolean; withdrawn?: boolean } | undefined,
  ): string | null {
    if (!i || i.accepted) return "used";
    if (i.withdrawn) return "withdrawn";
    return i.expired ? "expired" : null;
  }

  private async acceptInvitation(route: Route, token: string): Promise<void> {
    const i = this.invitationLinks.get(token);
    const reason = this.goneReason(i);
    if (reason)
      return route.fulfill({
        status: 410,
        json: {
          reason,
          invitedBy: i ? "Tom Nguyen" : null,
          organization: i ? "Harbourview Youth Collective" : null,
        },
      });
    const b = route.request().postDataJSON() as {
      name?: string;
      password?: string;
    };
    const errors: Record<string, string> = {};
    if (!b.name?.trim()) errors["name"] = "Enter your name.";
    const weak = passwordProblem(b.password, i.email);
    if (weak) errors["password"] = weak;
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    i.accepted = true;
    if (["Youth", "Mentor", "Volunteer"].includes(i.role)) {
      // A participant joins as a new membership of this test; a youth account links to the invitation's child (L2-052).
      const id = `m-joined-${this.nextId++}`;
      memberships.push({
        id,
        organizationId: "org-harbourview",
        personName: b.name!.trim(),
        email: i.email,
        role: i.role as Membership["role"],
      });
      if (i.childId) this.youthLinks.set(id, i.childId);
      this.membershipId = id;
      return route.fulfill({ json: { status: "signed-in" } });
    }
    // The new worker signs in as the seeded youth worker membership (the fake has no account store).
    this.membershipId = "m-aisha";
    return route.fulfill({ json: { status: "signed-in" } });
  }

  private async savePhone(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const b = route.request().postDataJSON() as { mobile?: string };
    if ((b.mobile ?? "").replace(/\D/g, "").length !== 10)
      return route.fulfill({
        status: 422,
        json: {
          errors: { mobile: "Include the area code, like 905-555-0101." },
        },
      });
    this.savedPhone = b.mobile!;
    return route.fulfill({ status: 204 });
  }

  private async coverage(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    if (
      ![
        "Admin",
        "ProgramDirector",
        "SiteLead",
        "VolunteerCoordinator",
      ].includes(m.role)
    )
      return this.forbidden(route);
    const people = this.staffOf(m);
    const end = NOW.getTime() + 14 * 24 * 3600 * 1000;
    const sessions = this.events
      .filter(
        (e) =>
          e.organizationId === m.organizationId &&
          e.status === "Scheduled" &&
          new Date(e.endsAt).getTime() > NOW.getTime() &&
          new Date(e.startsAt).getTime() < end,
      )
      .sort((a, z) => a.startsAt.localeCompare(z.startsAt))
      .map((e) => {
        const staff = (this.sessionStaff.get(e.id) ?? [])
          .map((id) => people.find((p) => p.id === id))
          .filter((p) => !!p)
          .map((p) => ({ id: p!.id, name: p!.personName, role: p!.role }));
        return {
          id: e.id,
          name: e.name,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          place: e.place,
          staff,
          gap: staff.length === 0,
        };
      });
    // Youth accounts are never staffed onto a session (ADR 0043).
    const assignable = people.filter((p) => p.role !== "Youth");
    return route.fulfill({
      json: {
        sessions,
        people: assignable.map((p) => ({
          id: p.id,
          name: p.personName,
          role: p.role,
        })),
      },
    });
  }

  private async assignStaff(route: Route, eventId: string): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    if (
      ![
        "Admin",
        "ProgramDirector",
        "SiteLead",
        "VolunteerCoordinator",
      ].includes(m.role)
    )
      return this.forbidden(route);
    const e = this.ownEvent(m, eventId);
    if (!e) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as { membershipIds: string[] };
    if (b.membershipIds.some((id) => !this.staffOf(m).some((p) => p.id === id)))
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            membershipIds: "Choose people who work for this organization.",
          },
        },
      });
    this.sessionStaff.set(e.id, [...b.membershipIds]);
    return route.fulfill({ status: 204 });
  }

  /** The last successful sign-in by email (as SignInAttempts would hold them), for the people directory (L2-112). */
  private lastSignIns = new Map<string, string>([
    ["tom@harbourview.example", "2026-11-05T14:02:00Z"],
    ["sofia@harbourview.example", "2026-11-05T21:10:00Z"],
    ["daniel@harbourview.example", "2026-11-05T21:05:00Z"],
    ["jaylen@harbourview.example", "2026-11-05T20:55:00Z"],
    ["marisol@harbourview.example", "2026-11-05T14:15:00Z"],
    ["aisha@harbourview.example", "2026-11-05T20:40:00Z"],
  ]);

  /** Mirrors backend PersonDetails: a youth's child's programs or a mentor's cohorts, and mentoring while Mentoring is on. */
  private personFacts(x: Membership, mentoring: boolean) {
    const childId = this.youthLinks.get(x.id);
    const programs = this.programs
      .filter((p) => p.organizationId === x.organizationId)
      .filter(
        (p) =>
          (childId !== undefined && p.roster.includes(childId)) ||
          (mentoring &&
            (this.cohortMentors.get(p.id)?.lead === x.id ||
              !!this.cohortMentors.get(p.id)?.supporting.includes(x.id))),
      )
      .map((p) => p.name)
      .sort();
    const childName = (id: string) =>
      this.households.flatMap((h) => h.children).find((c) => c.id === id);
    const mentorId = childId ? this.youthMentors.get(childId) : undefined;
    return {
      programs,
      mentoring: mentoring
        ? {
            mentor: mentorId
              ? (memberships.find((m) => m.id === mentorId)?.personName ?? null)
              : null,
            youth: [...this.youthMentors]
              .filter(([, mentor]) => mentor === x.id)
              .map(([c]) => {
                const child = childName(c);
                return child ? `${child.firstName} ${child.lastName}` : "";
              })
              .filter(Boolean)
              .sort(),
          }
        : undefined,
    };
  }

  /** Mirrors backend PeopleHandler.ListAsync (L2-112, L2-114): admins only, filtered on the server, 25 to a page. */
  private async listPeople(route: Route): Promise<void> {
    const m = await this.adminCaller(route);
    if (!m) return;
    const url = new URL(route.request().url());
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const role = url.searchParams.get("role") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const programId = url.searchParams.get("programId") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const mentoring = this.modules.get(m.organizationId)!.includes("Mentoring");
    const roles = [
      "Admin",
      "ProgramDirector",
      "SiteLead",
      "YouthWorker",
      "VolunteerCoordinator",
      "Youth",
      "Mentor",
      "Volunteer",
    ].filter((r) => mentoring || r !== "Mentor");
    const errors: Record<string, string> = {};
    if (role && !roles.includes(role)) errors["role"] = "Choose a role.";
    if (status && status !== "Active" && status !== "Deactivated")
      errors["status"] = "Choose Active or Deactivated.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const all = this.staffOf(m)
      .map((x) => ({
        x,
        role: this.roleOverrides.get(x.id) ?? x.role,
        status: this.deactivatedMembers.has(x.id) ? "Deactivated" : "Active",
        facts: this.personFacts(x, mentoring),
      }))
      .filter((p) => !role || p.role === role)
      .filter((p) => !status || p.status === status)
      .filter(
        (p) =>
          !q ||
          p.x.personName.toLowerCase().includes(q) ||
          p.x.email.toLowerCase().includes(q),
      )
      .filter(
        (p) =>
          !programId ||
          p.facts.programs.includes(
            this.programs.find((pr) => pr.id === programId)?.name ?? "\u0000",
          ),
      )
      .sort((a, z) => a.x.personName.localeCompare(z.x.personName));
    return route.fulfill({
      json: {
        items: all.slice((page - 1) * 25, page * 25).map((p) => ({
          id: p.x.id,
          name: p.x.personName,
          email: p.x.email,
          role: p.role,
          status: p.status,
          programs: p.facts.programs,
          lastSignedInAt: this.lastSignIns.get(p.x.email) ?? null,
          isYou: p.x.id === m.id,
          ...(p.facts.mentoring ? { mentoring: p.facts.mentoring } : {}),
        })),
        total: all.length,
        page,
        pageSize: 25,
        roles,
        programs: this.programs
          .filter(
            (p) =>
              p.organizationId === m.organizationId && p.status === "Active",
          )
          .map((p) => ({ id: p.id, name: p.name }))
          .sort((a, z) => a.name.localeCompare(z.name)),
      },
    });
  }

  /** The account's history, newest first, as the audit log holds it (L2-113 criterion 1). */
  private personHistory = new Map<
    string,
    { at: string; action: string; summary: string; by: string }[]
  >();

  private recordPersonHistory(
    id: string,
    action: string,
    summary: string,
    by: string,
  ): void {
    this.personHistory.set(id, [
      { at: "2026-11-05T21:20:00Z", action, summary, by },
      ...(this.personHistory.get(id) ?? []),
    ]);
  }

  /** A youth's lessons done of total and earned badges, as LearnerProgress and LearnerBadges answer them for her membership. */
  private personLearning(x: Membership) {
    const programs = this.placementsOf(x);
    const tracks = this.learningState.tracks(x.id, programs);
    const lessons = tracks.flatMap((t) => t.modules.flatMap((m) => m.lessons));
    return {
      lessonsDone: lessons.filter((l) => l.done).length,
      lessonsTotal: lessons.length,
      badges: this.journey.badgesOf(x, programs).earned.map((b) => b.name),
    };
  }

  /** Mirrors backend AccountLifecycleHandler.DeactivateAsync (L2-113 criterion 4). */
  private async deactivatePersonRoute(route: Route, id: string): Promise<void> {
    const m = await this.adminCaller(route);
    if (!m) return;
    const x = this.staffOf(m).find((p) => p.id === id);
    if (!x) return route.fulfill({ status: 404 });
    if (x.id === m.id)
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            member: "You can’t deactivate your own account. Ask another admin.",
          },
        },
      });
    if (!this.deactivatedMembers.has(id)) {
      this.deactivatePerson(id, m.personName);
      this.recordPersonHistory(
        id,
        "Deactivated",
        `${x.personName}’s account deactivated by ${m.personName}`,
        m.personName,
      );
    }
    return route.fulfill({ status: 204 });
  }

  /** Mirrors backend AccountLifecycleHandler.ReactivateAsync (L2-113 criteria 5 and 6). */
  private async reactivatePersonRoute(route: Route, id: string): Promise<void> {
    const m = await this.adminCaller(route);
    if (!m) return;
    const x = this.staffOf(m).find((p) => p.id === id);
    if (!x) return route.fulfill({ status: 404 });
    if (this.deletedChildRecords.has(id))
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            member: `${x.personName.split(" ")[0]}’s child record was deleted, so the account stays off.`,
          },
        },
      });
    if (this.deactivatedMembers.delete(id)) {
      this.removedMemberships.delete(id);
      this.recordPersonHistory(
        id,
        "Reactivated",
        `${x.personName}’s account reactivated by ${m.personName}`,
        m.personName,
      );
    }
    return route.fulfill({ status: 204 });
  }

  /** Mirrors backend PeopleHandler.GetAsync (L2-113, L2-114): admins only, this organization's current accounts only. */
  private async getPerson(route: Route, id: string): Promise<void> {
    const m = await this.adminCaller(route);
    if (!m) return;
    const x = this.staffOf(m).find((p) => p.id === id);
    if (!x) return route.fulfill({ status: 404 });
    const on = this.modules.get(m.organizationId)!;
    const facts = this.personFacts(x, on.includes("Mentoring"));
    const role = this.roleOverrides.get(x.id) ?? x.role;
    const childId = this.youthLinks.get(x.id);
    const household = childId
      ? this.households.find((h) => h.children.some((c) => c.id === childId))
      : undefined;
    const child = household?.children.find((c) => c.id === childId);
    const learning =
      on.includes("Learning") && role === "Youth"
        ? this.personLearning(x)
        : undefined;
    return route.fulfill({
      json: {
        id: x.id,
        name: x.personName,
        email: x.email,
        role,
        status: this.deactivatedMembers.has(x.id) ? "Deactivated" : "Active",
        deactivatedAt: this.deactivatedMembers.get(x.id)?.at ?? null,
        deactivatedBy: this.deactivatedMembers.get(x.id)?.by ?? null,
        lastSignedInAt: this.lastSignIns.get(x.email) ?? null,
        isYou: x.id === m.id,
        child:
          child && household
            ? {
                id: child.id,
                name: `${child.firstName} ${child.lastName}`,
                age: ageOf(child.dateOfBirth),
                household: household.name,
                householdId: household.id,
                deleted: this.deletedChildRecords.has(x.id),
              }
            : null,
        programs: facts.programs,
        history: this.personHistory.get(x.id) ?? [],
        ...(facts.mentoring ? { mentoring: facts.mentoring } : {}),
        ...(learning ? { learning } : {}),
      },
    });
  }

  private async listStaff(route: Route): Promise<void> {
    const m = await this.adminCaller(route);
    if (!m) return;
    return route.fulfill({
      json: {
        members: this.staffOf(m)
          .map((x) => ({
            id: x.id,
            name: x.personName,
            email: x.email,
            role: this.roleOverrides.get(x.id) ?? x.role,
            isYou: x.id === m.id,
          }))
          .sort((a, z) => a.name.localeCompare(z.name)),
        invitations: this.invitations
          .filter((i) => i.organizationId === m.organizationId && !i.withdrawn)
          .map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role,
            invitedBy: i.invitedBy,
            invitedAt: "2026-11-05T21:12:00Z",
            expiresAt: i.expired
              ? "2026-11-04T21:12:00Z"
              : "2026-11-19T21:12:00Z",
            status: i.expired ? "Expired" : "Pending",
            childName:
              i.childName ?? (i.childId ? this.childName(i.childId) : null),
            replacementRequested: !!i.replacementRequested,
          })),
      },
    });
  }

  private async inviteStaff(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    if (!["Admin", "VolunteerCoordinator"].includes(m.role))
      return this.forbidden(route);
    const b = route.request().postDataJSON() as {
      email?: string;
      role?: string;
    };
    const email = (b.email ?? "").trim().toLowerCase();
    const errors: Record<string, string> = {};
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email))
      errors["email"] = "Enter a work email like name@example.org.";
    if (
      ![
        "Admin",
        "ProgramDirector",
        "SiteLead",
        "YouthWorker",
        "VolunteerCoordinator",
        "Youth",
        "Mentor",
        "Volunteer",
      ].includes(b.role ?? "")
    )
      errors["role"] = "Choose a role.";
    if (
      !errors["role"] &&
      m.role === "VolunteerCoordinator" &&
      b.role !== "YouthWorker"
    )
      errors["role"] =
        "Coordinators invite youth workers. Ask an admin for other roles.";
    else if (!errors["role"] && b.role === "Youth")
      errors["role"] = "Invite youth from their child record.";
    else if (
      !errors["role"] &&
      b.role === "Mentor" &&
      !this.modules.get(m.organizationId)!.includes("Mentoring")
    )
      errors["role"] = "Turn on Mentoring to invite mentors.";
    const member = this.staffOf(m).find((x) => x.email === email);
    if (!errors["email"] && member)
      errors["email"] = `${member.personName} already has access.`;
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const id = `inv-${this.nextId++}`;
    this.invitations.push({
      id,
      organizationId: m.organizationId,
      email,
      role: b.role!,
      invitedBy: m.personName,
      withdrawn: false,
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  /** The caller for the youth-account endpoints: an admin, Learning on, a child of their organization (L2-051). */
  private async youthCaller(
    route: Route,
    childId: string,
  ): Promise<{
    m: Membership;
    child: {
      id: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
    };
  } | null> {
    const m = await this.adminCaller(route);
    if (!m) return null;
    const found = this.modules.get(m.organizationId)!.includes("Learning")
      ? this.ownChild(m, childId)
      : undefined;
    if (!found) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return { m, child: found.child };
  }

  private linkedYouth(childId: string): Membership | undefined {
    const id = [...this.youthLinks].find(([, c]) => c === childId)?.[0];
    return memberships.find(
      (x) => x.id === id && !this.removedMembers.has(x.id),
    );
  }

  private async youthAccount(route: Route, childId: string): Promise<void> {
    const found = await this.youthCaller(route, childId);
    if (!found) return;
    const member = this.linkedYouth(childId);
    if (member)
      return route.fulfill({
        json: {
          status: "Active",
          name: member.personName,
          email: member.email,
          expiresAt: null,
        },
      });
    const waiting = this.invitations.find(
      (i) => i.childId === childId && !i.withdrawn,
    );
    return route.fulfill({
      json: waiting
        ? {
            status: "Invited",
            name: null,
            email: waiting.email,
            expiresAt: "2026-11-19T21:12:00Z",
          }
        : { status: "None", name: null, email: null, expiresAt: null },
    });
  }

  private async inviteYouth(route: Route, childId: string): Promise<void> {
    const found = await this.youthCaller(route, childId);
    if (!found) return;
    const { m, child } = found;
    const email = (
      (route.request().postDataJSON() as { email?: string }).email ?? ""
    )
      .trim()
      .toLowerCase();
    const name = `${child.firstName} ${child.lastName}`;
    const age = ageOf(child.dateOfBirth);
    const errors: Record<string, string> = {};
    if (age < 12 || age > 18)
      errors["childId"] = "Youth accounts are for ages 12 to 18.";
    else if (this.linkedYouth(child.id))
      errors["childId"] = `${name} already has a youth account.`;
    else if (
      this.invitations.some((i) => i.childId === child.id && !i.withdrawn)
    )
      errors["childId"] = `An invitation for ${name} is already waiting.`;
    const member = this.staffOf(m).find((x) => x.email === email);
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email))
      errors["email"] = "Enter an email like name@example.org.";
    else if (member)
      errors["email"] = `${member.personName} already has access.`;
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const id = `inv-${this.nextId++}`;
    this.invitations.push({
      id,
      organizationId: m.organizationId,
      email,
      role: "Youth",
      invitedBy: m.personName,
      withdrawn: false,
      childId: child.id,
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  private childName(childId: string): string | null {
    const c = this.households
      .flatMap((h) => h.children)
      .find((x) => x.id === childId);
    return c ? `${c.firstName} ${c.lastName}` : null;
  }

  private async resendInvitation(route: Route, id: string): Promise<void> {
    const m = await this.adminCaller(route);
    if (!m) return;
    const i = this.invitations.find(
      (x) =>
        x.id === id && x.organizationId === m.organizationId && !x.withdrawn,
    );
    if (!i) return route.fulfill({ status: 404 });
    i.expired = false;
    i.replacementRequested = false;
    this.resentInvitations.push(i.email);
    return route.fulfill({ status: 204 });
  }

  private async withdrawInvitation(route: Route, id: string): Promise<void> {
    const m = await this.adminCaller(route);
    if (!m) return;
    const i = this.invitations.find(
      (x) =>
        x.id === id && x.organizationId === m.organizationId && !x.withdrawn,
    );
    if (!i) return route.fulfill({ status: 404 });
    i.withdrawn = true;
    return route.fulfill({ status: 204 });
  }

  private async changeRole(route: Route, id: string): Promise<void> {
    const m = await this.adminCaller(route);
    if (!m) return;
    const target = this.staffOf(m).find((x) => x.id === id);
    if (!target) return route.fulfill({ status: 404 });
    if (target.id === m.id)
      return route.fulfill({
        status: 422,
        json: { errors: { role: "You can’t change your own role." } },
      });
    const role = (route.request().postDataJSON() as { role: string }).role;
    const before = this.roleOverrides.get(id) ?? target.role;
    // Mirrors backend StaffAccessHandler.ChangeRoleAsync (L2-113 criterion 3, ADR 0070).
    const refusal =
      before === "Youth"
        ? "A youth account’s role follows its child record."
        : role === "Youth"
          ? "Invite youth from their child record."
          : role === "Mentor" &&
              !this.modules.get(m.organizationId)!.includes("Mentoring")
            ? "Turn on Mentoring to make someone a mentor."
            : null;
    if (refusal)
      return route.fulfill({
        status: 422,
        json: { errors: { role: refusal } },
      });
    this.roleOverrides.set(id, role);
    this.recordPersonHistory(
      id,
      "RoleChanged",
      `${target.personName} · ${before} → ${role} by ${m.personName}`,
      m.personName,
    );
    return route.fulfill({ status: 204 });
  }

  private async removeStaff(route: Route, id: string): Promise<void> {
    const m = await this.adminCaller(route);
    if (!m) return;
    const target = this.staffOf(m).find((x) => x.id === id);
    if (!target) return route.fulfill({ status: 404 });
    if (target.id === m.id)
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            member: "You can’t remove your own access. Ask another admin.",
          },
        },
      });
    this.removedMembers.add(id);
    return route.fulfill({ status: 204 });
  }

  /** The guardian answers the latest waiting pickup request from their phone, as the family page would. */
  guardianDecides(approve: boolean): void {
    const r = [...this.pickupRequests]
      .reverse()
      .find((x) => x.status === "Pending")!;
    const household = this.households.find((h) => h.id === r.householdId)!;
    Object.assign(r, {
      status: approve ? "Approved" : "Refused",
      decidedBy: this.sortedGuardians(household)[0]?.name ?? null,
    });
  }

  /** Someone waiting to collect a child of this household (seeded as the API would store it). */
  waitingPickup(eventId: string, childId: string, collector: string): string {
    const household = this.households.find((h) =>
      h.children.some((c) => c.id === childId),
    )!;
    const id = `pr-${this.nextId++}`;
    this.pickupRequests.push({
      id,
      eventId,
      childId,
      householdId: household.id,
      collector,
      status: "Pending",
      decidedBy: null,
    });
    return id;
  }

  private async askForPickup(route: Route, eventId: string): Promise<void> {
    const m = await this.pickupCaller(route);
    if (!m) return;
    const e = this.ownEvent(m, eventId);
    const b = route.request().postDataJSON() as {
      childId: string;
      collectorName: string;
    };
    const found = this.ownChild(m, b.childId);
    if (!e || !found) return route.fulfill({ status: 404 });
    if (this.sessionRecords(e.id).get(b.childId)?.status !== "Present")
      return route.fulfill({
        status: 422,
        json: { errors: { childId: "Not checked in." } },
      });
    if (!b.collectorName?.trim())
      return route.fulfill({
        status: 422,
        json: { errors: { collectorName: "Enter their name." } },
      });
    return route.fulfill({
      status: 201,
      json: { id: this.waitingPickup(e.id, b.childId, b.collectorName.trim()) },
    });
  }

  private async pickupRequest(route: Route, id: string): Promise<void> {
    const m = await this.pickupCaller(route);
    if (!m) return;
    const r = this.pickupRequests.find((x) => x.id === id);
    if (!r) return route.fulfill({ status: 404 });
    return route.fulfill({
      json: {
        id: r.id,
        childId: r.childId,
        collectorName: r.collector,
        status: r.status,
        decidedBy: r.decidedBy,
        decidedAt: null,
        incidentId: r.status === "Refused" ? "inc-refused" : null,
      },
    });
  }

  private async guardianDecidesPickup(
    route: Route,
    token: string,
    id: string,
  ): Promise<void> {
    const household = this.guardianHousehold(token);
    if (!household)
      return route.fulfill({ status: 410, json: { code: "link-expired" } });
    if (!this.trustedHouseholds.has(household.id))
      return route.fulfill({
        status: 401,
        json: { code: "verification-required" },
      });
    const r = this.pickupRequests.find(
      (x) =>
        x.id === id && x.householdId === household.id && x.status === "Pending",
    );
    if (!r) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as { approve: boolean };
    Object.assign(r, {
      status: b.approve ? "Approved" : "Refused",
      decidedBy: this.sortedGuardians(household)[0]?.name ?? null,
    });
    return route.fulfill({ status: 204 });
  }

  private async guardianUpdateHousehold(
    route: Route,
    token: string,
  ): Promise<void> {
    const household = this.guardianHousehold(token);
    if (!household)
      return route.fulfill({ status: 410, json: { code: "link-expired" } });
    if (!this.trustedHouseholds.has(household.id))
      return route.fulfill({
        status: 401,
        json: { code: "verification-required" },
      });
    const b = route.request().postDataJSON() as {
      mobile?: string;
      email?: string;
      language?: string;
    };
    const mobile = b.mobile?.trim() || null;
    const email = b.email?.trim() || null;
    const errors: Record<string, string> = {};
    if (mobile && mobile.replace(/\D/g, "").length !== 10)
      errors["mobile"] = "Enter a ten-digit mobile number.";
    if (email && !/^[^@]+@[^@]+\.[^@]+$/.test(email))
      errors["email"] = "Enter an email like name@example.com.";
    if (!mobile && !email)
      errors["mobile"] =
        "Leave a mobile number or an email so we can reach you.";
    if (!["English", "Spanish", "French"].includes(b.language ?? ""))
      errors["language"] = "Choose English, Spanish or French.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const primary = this.sortedGuardians(household)[0]!;
    const changed = primary.mobile !== mobile;
    Object.assign(primary, { mobile, email });
    household.language = b.language!;
    if (changed) {
      this.trustedHouseholds.delete(household.id);
      this.homeLinks.delete(token);
    }
    return route.fulfill({ status: 204 });
  }

  /** A guardian saved a child's medical details from the family page (seeded as the API would store it). */
  guardianUpdatesMedical(
    token: string,
    childId: string,
    allergies: string,
    medication: string,
  ): void {
    const household = this.guardianHousehold(token)!;
    const child = household.children.find((c) => c.id === childId)!;
    child.medical = { ...child.medical, allergies, medication };
  }

  private async guardianUpdateMedical(
    route: Route,
    token: string,
    childId: string,
  ): Promise<void> {
    const household = this.guardianHousehold(token);
    if (!household)
      return route.fulfill({ status: 410, json: { code: "link-expired" } });
    if (!this.trustedHouseholds.has(household.id))
      return route.fulfill({
        status: 401,
        json: { code: "verification-required" },
      });
    const child = household.children.find((c) => c.id === childId);
    if (!child) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      allergies?: string;
      medication?: string;
    };
    child.medical = {
      ...child.medical,
      allergies: b.allergies?.trim() || null,
      medication: b.medication?.trim() || null,
    };
    return route.fulfill({ status: 204 });
  }

  private activePickups(childId: string) {
    return this.extraPickups
      .filter((x) => x.childId === childId && !x.removed)
      .sort((a, z) => a.name.localeCompare(z.name));
  }

  private validatePickup(route: Route, firstName: string) {
    const b = route.request().postDataJSON() as {
      name?: string;
      relationship?: string;
      siblings?: boolean;
    };
    const errors: Record<string, string> = {};
    if (!b.name?.trim()) errors["name"] = "Enter the adult’s full name.";
    if (!b.relationship?.trim())
      errors["relationship"] = `Say how they know ${firstName}.`;
    return { b, errors };
  }

  private async savePickup(
    route: Route,
    household: { id: string; children: { id: string; firstName: string }[] },
    childId: string,
  ): Promise<void> {
    const child = household.children.find((c) => c.id === childId);
    if (!child) return route.fulfill({ status: 404 });
    const { b, errors } = this.validatePickup(route, child.firstName);
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    let first = "";
    for (const c of b.siblings ? household.children : [child]) {
      const id = this.approvePickup(
        c.id,
        b.name!.trim(),
        b.relationship!.trim(),
      );
      if (c.id === childId) first = id;
    }
    return route.fulfill({ status: 201, json: { id: first } });
  }

  private async addPickup(route: Route, childId: string): Promise<void> {
    const m = await this.pickupCaller(route);
    if (!m) return;
    if (!can.managePickups(m)) return this.forbidden(route);
    const found = this.ownChild(m, childId);
    if (!found) return route.fulfill({ status: 404 });
    return this.savePickup(route, found.household, childId);
  }

  private async removePickup(
    route: Route,
    childId: string,
    pickupId: string,
  ): Promise<void> {
    const m = await this.pickupCaller(route);
    if (!m) return;
    if (!can.managePickups(m)) return this.forbidden(route);
    const found = this.ownChild(m, childId);
    const pickup = this.extraPickups.find(
      (x) => x.id === pickupId && x.childId === childId && !x.removed,
    );
    if (!found || !pickup) return route.fulfill({ status: 404 });
    pickup.removed = true;
    return route.fulfill({ status: 204 });
  }

  private guardianHousehold(token: string) {
    const householdId = this.homeLinks.get(token);
    return householdId
      ? this.households.find((h) => h.id === householdId)
      : undefined;
  }

  private async guardianAddPickup(
    route: Route,
    token: string,
    childId: string,
  ): Promise<void> {
    const household = this.guardianHousehold(token);
    if (!household)
      return route.fulfill({ status: 410, json: { code: "link-expired" } });
    if (!this.trustedHouseholds.has(household.id))
      return route.fulfill({
        status: 401,
        json: { code: "verification-required" },
      });
    return this.savePickup(route, household, childId);
  }

  private async guardianRemovePickup(
    route: Route,
    token: string,
    childId: string,
    pickupId: string,
  ): Promise<void> {
    const household = this.guardianHousehold(token);
    if (!household)
      return route.fulfill({ status: 410, json: { code: "link-expired" } });
    if (!this.trustedHouseholds.has(household.id))
      return route.fulfill({
        status: 401,
        json: { code: "verification-required" },
      });
    const pickup = this.extraPickups.find(
      (x) =>
        x.id === pickupId &&
        x.childId === childId &&
        x.householdId === household.id &&
        !x.removed,
    );
    if (!pickup) return route.fulfill({ status: 404 });
    pickup.removed = true;
    return route.fulfill({ status: 204 });
  }

  private async signChildOut(route: Route, id: string): Promise<void> {
    const m = await this.pickupCaller(route);
    if (!m) return;
    if (!can.runSessions(m)) return this.forbidden(route);
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
    if (!this.mayRun(m, e.id)) return this.forbidden(route);
    const b = route.request().postDataJSON() as {
      childId: string;
      guardianId: string | null;
      someoneElse: boolean;
      otherName: string | null;
      guardianConfirmed: boolean;
      idChecked: boolean;
      leftAt: string | null;
      clientActionId: string;
    };
    if (this.actions.has(b.clientActionId))
      return route.fulfill({ json: { status: "saved" } });
    const found = this.ownChild(m, b.childId);
    const record = this.sessionRecords(e.id).get(b.childId);
    if (found && record?.status !== "Present") {
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            childId: `${found.child.firstName} ${found.child.lastName} is not checked in.`,
          },
        },
      });
    }
    const guardians = found ? this.sortedGuardians(found.household) : [];
    const primary = guardians[0];
    const first = found?.child.firstName ?? "the child";
    const errors: Record<string, string> = {};
    let collectedBy: string | null = null;
    if (b.guardianId) {
      const g = guardians.find((x) => x.id === b.guardianId && x.canPickUp);
      if (!g)
        errors["who"] =
          `Not on ${first}’s approved list. Call ${primary?.name} at ${primary?.mobile} before ${first} leaves.`;
      collectedBy = g?.name ?? null;
    } else if (b.someoneElse) {
      if (!b.otherName?.trim()) errors["otherName"] = "Enter their name.";
      if (!b.guardianConfirmed)
        errors["guardianConfirmed"] =
          `${primary?.name ?? "The guardian"} needs to okay this by phone first.`;
      collectedBy = b.otherName?.trim() ?? null;
    } else {
      errors["who"] = `Choose who is taking ${first} home.`;
    }
    if (!b.idChecked)
      errors["idChecked"] = "Check photo ID, or confirm you know this person.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    this.actions.add(b.clientActionId);
    this.sessionRecords(e.id).set(b.childId, {
      ...record!,
      status: "SignedOut",
      signedOutAt: b.leftAt ?? NOW.toISOString(),
      collectedBy,
    });
    return route.fulfill({ json: { status: "saved" } });
  }

  private async messagingCaller(route: Route): Promise<Membership | null> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      await this.unauthenticated(route);
      return null;
    }
    if (!this.modules.get(m.organizationId)!.includes("Messages")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    if (!can.sendMessages(m)) {
      await this.forbidden(route);
      return null;
    }
    return m;
  }

  private capOf(m: Membership) {
    const plan = organizations.find((o) => o.id === m.organizationId)!.plan;
    const cap = plan === "Free" ? 200 : plan === "Standard" ? 2000 : 5000;
    const used = this.smsUsed.get(m.organizationId) ?? 0;
    return { cap, used, remaining: Math.max(0, cap - used) };
  }

  /** Households with children enrolled in the program (or the event's program), each with the channel that reaches its primary guardian. */
  private audienceOf(m: Membership, b: AudienceBody) {
    const programId = b.eventId
      ? this.ownEvent(m, b.eventId)?.programId
      : b.programId;
    const programs = this.programs.filter(
      (p) =>
        p.organizationId === m.organizationId &&
        (!programId || p.id === programId),
    );
    const childIds = new Set(programs.flatMap((p) => p.roster));
    const label = b.eventId
      ? (this.ownEvent(m, b.eventId)?.name ?? "All programs")
      : programs.length === 1 && programId
        ? programs[0]!.name
        : "All programs";
    const recipients = this.households
      .filter(
        (h) =>
          h.organizationId === m.organizationId &&
          h.children.some((c) => childIds.has(c.id)) &&
          (!b.language || h.language === b.language),
      )
      .sort((a, z) => a.name.localeCompare(z.name))
      .map((h) => {
        const g = this.sortedGuardians(h)[0];
        const mobile = g?.mobile || null;
        const email = g?.email && !g.emailBounced ? g.email : null;
        const base = {
          household: h.name.replace(/ household$/, ""),
          householdId: h.id,
          guardian: g?.name ?? null,
          language: h.language,
        };
        if (b.channel === "TextOnly")
          return {
            ...base,
            channel: "Sms" as const,
            to: mobile,
            fallback: null,
            unreachable: mobile ? null : "No mobile number",
          };
        if (b.channel === "EmailOnly")
          return {
            ...base,
            channel: "Email" as const,
            to: email,
            fallback: null,
            unreachable: email ? null : "No email address",
          };
        return mobile
          ? {
              ...base,
              channel: "Sms" as const,
              to: mobile,
              fallback: email,
              unreachable: null,
            }
          : {
              ...base,
              channel: "Email" as const,
              to: email,
              fallback: null,
              unreachable: email ? null : "No mobile number or email",
            };
      });
    return {
      label: b.language ? `${label} · ${b.language} households` : label,
      recipients,
    };
  }

  private async previewMessage(route: Route): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const b = route.request().postDataJSON() as AudienceBody;
    const { recipients } = this.audienceOf(m, b);
    const org = organizations.find((o) => o.id === m.organizationId)!;
    const text = `${org.name}: ${(b.body ?? "").trim()}`;
    const segments = segmentsOf(text);
    const reachable = recipients.filter((r) => !r.unreachable);
    const texts = reachable.filter((r) => r.channel === "Sms");
    const { remaining } = this.capOf(m);
    const textable = Math.floor(remaining / segments);
    return route.fulfill({
      json: {
        recipientCount: recipients.length,
        textCount: texts.length,
        emailCount: reachable.length - texts.length,
        unreachableCount: recipients.length - reachable.length,
        characters: text.length,
        segments,
        totalSegments: texts.length * segments,
        remainingSegments: remaining,
        fallingBackToEmail: texts.slice(textable).filter((r) => r.fallback)
          .length,
      },
    });
  }

  /** Creates the message and runs the send job at once: texts within the cap, email instead or paused beyond it. */
  private async sendMessage(route: Route): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const b = route.request().postDataJSON() as AudienceBody;
    const body = (b.body ?? "").trim();
    const { label, recipients } = this.audienceOf(m, b);
    const errors: Record<string, string> = {};
    if (!body) errors["body"] = "Enter a message.";
    else if (body.length > 480) errors["body"] = "Keep it to 480 characters.";
    if (recipients.length === 0)
      errors["audience"] = "Nobody matches. Loosen a filter.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const deliveries = this.deliver(m, recipients, body);
    const id = `msg-${this.nextId++}`;
    this.messages.unshift({
      id,
      organizationId: m.organizationId,
      title: titleOf(body),
      body,
      sentAt: NOW.toISOString(),
      sentBy: m.personName,
      audience: label,
      channel: b.channel,
      deliveries,
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  /** The send job at once: texts within the cap, email instead or paused beyond it. */
  private deliver(
    m: Membership,
    recipients: ReturnType<FakeApi["audienceOf"]>["recipients"],
    body: string,
  ): FakeDelivery[] {
    const org = organizations.find((o) => o.id === m.organizationId)!;
    const segments = segmentsOf(`${org.name}: ${body}`);
    const now = NOW.toISOString();
    return recipients.map((r) => {
      const base = {
        household: r.household,
        householdId: r.householdId,
        guardian: r.guardian,
        language: r.language,
        at: null as string | null,
      };
      if (r.unreachable)
        return {
          ...base,
          channel: r.channel,
          status: "Failed",
          reason: r.unreachable,
        };
      if (r.channel === "Email")
        return {
          ...base,
          channel: "Email",
          status: "Sent",
          reason: null,
          at: now,
        };
      const { remaining, used } = this.capOf(m);
      if (remaining >= segments) {
        this.smsUsed.set(m.organizationId, used + segments);
        return {
          ...base,
          channel: "Sms",
          status: "Sent",
          reason: null,
          at: now,
        };
      }
      return r.fallback
        ? {
            ...base,
            channel: "Email",
            status: "FellBackToEmail",
            reason: "SMS cap reached",
            at: now,
          }
        : {
            ...base,
            channel: "Sms",
            status: "Paused",
            reason: "SMS cap reached",
          };
    });
  }

  /** The members an announcement reaches in the app (L2-105 criterion 3): youth accounts of enrolled children, mentors of the program. */
  private announcementMembers(a: FakeAnnouncement): string[] {
    const programs = this.programs.filter(
      (p) =>
        p.organizationId === a.organizationId &&
        p.status === "Active" &&
        (!a.programId || p.id === a.programId),
    );
    const children = new Set(programs.flatMap((p) => p.roster));
    const active = memberships.filter(
      (x) =>
        x.organizationId === a.organizationId && !this.removedMembers.has(x.id),
    );
    const ids: string[] = [];
    if (reachesYouth(a))
      ids.push(
        ...active
          .filter(
            (x) =>
              x.role === "Youth" &&
              children.has(this.youthLinks.get(x.id) ?? ""),
          )
          .map((x) => x.id),
      );
    if (reachesMentors(a)) {
      const named = new Set<string>();
      for (const p of programs) {
        const team = this.cohortMentors.get(p.id);
        if (team) [team.lead, ...team.supporting].forEach((x) => named.add(x));
      }
      [...this.youthMentors]
        .filter(([child]) => children.has(child))
        .forEach(([, mentor]) => named.add(mentor));
      ids.push(
        ...active
          .filter(
            (x) => x.role === "Mentor" && (!a.programId || named.has(x.id)),
          )
          .map((x) => x.id),
      );
    }
    return [...new Set(ids)];
  }

  /** Events waiting for each member's next stream response (L2-107). */
  private readonly realtimeQueue = new Map<string, string[]>();

  private publish(
    membershipIds: string[],
    event: "conversation" | "announcement" | "notification",
    data: object,
  ): void {
    for (const id of membershipIds)
      this.realtimeQueue.set(id, [
        ...(this.realtimeQueue.get(id) ?? []),
        `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
      ]);
  }

  /**
   * GET /realtime as a long poll: answers when an event is waiting for the caller, or after two seconds, then the browser reconnects (as it
   * does when a real stream drops) and the page fetches again.
   */
  private async realtime(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const started = Date.now();
    while (!this.realtimeQueue.get(m.id)?.length && Date.now() - started < 2000)
      await new Promise((r) => setTimeout(r, 50));
    const events = this.realtimeQueue.get(m.id) ?? [];
    this.realtimeQueue.set(m.id, []);
    try {
      await route.fulfill({
        status: 200,
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
        },
        body: `retry: 300\n\n${events.join("")}`,
      });
    } catch {
      // The page closed while the stream was open.
    }
  }

  /** The other side writes in a conversation, as the youth or her mentor would; its event goes to both unless told not to. */
  writeAs(
    senderId: string,
    youthId: string,
    body: string,
    options: { event?: boolean } = {},
  ): void {
    const childId = this.youthLinks.get(youthId)!;
    const mentorId = this.youthMentors.get(childId)!;
    const last = this.conversations.rows
      .map((r) => r.sentAt)
      .sort()
      .pop();
    const sentAt = new Date(
      Math.max(NOW.getTime(), last ? new Date(last).getTime() + 60_000 : 0),
    ).toISOString();
    this.conversations.seed({ youthId, mentorId, senderId, body, sentAt });
    const sender = memberships.find((x) => x.id === senderId)!;
    this.notify(
      sender.organizationId,
      [senderId === mentorId ? youthId : mentorId],
      "messages",
      `New message from ${sender.personName}`,
      `/conversations/${youthId}`,
    );
    if (options.event !== false)
      this.publish([youthId, mentorId], "conversation", { youthId });
  }

  /** Staff announce now, as Compose would; its in-app recipients' streams are told. */
  announceNow(row: Parameters<FakeAnnouncements["seed"]>[0]): void {
    const saved = this.announcements.seed(row);
    this.notify(
      saved.organizationId,
      this.announcementMembers(saved),
      "announcements",
      `${saved.sentBy} posted an announcement: ${saved.title}`,
      "/announcements",
    );
    this.publish(this.announcementMembers(saved), "announcement", {});
  }

  /** The caller of a conversations endpoint: Messages and Mentoring on; mentors, youth, admins and program directors (L2-106, L2-108). */
  private async conversationCaller(route: Route): Promise<Membership | null> {
    const m = await this.participantModuleCaller(route, "Messages", (x) =>
      ["Mentor", "Youth", "Admin", "ProgramDirector"].includes(x.role),
    );
    if (!m) return null;
    if (!this.modules.get(m.organizationId)!.includes("Mentoring")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return m;
  }

  /** A youth account of the caller's organization, her current mentor and whether a guardian's consent blocks it (ADR 0068). */
  private conversationScope(m: Membership, youthId: string) {
    const youth = memberships.find(
      (x) =>
        x.id === youthId &&
        x.role === "Youth" &&
        x.organizationId === m.organizationId &&
        !this.removedMembers.has(x.id),
    );
    const childId = youth ? this.youthLinks.get(youth.id) : undefined;
    if (!youth || !childId) return null;
    const mentorId = this.youthMentors.get(childId);
    const mentor =
      memberships.find(
        (x) =>
          x.id === mentorId &&
          x.role === "Mentor" &&
          !this.removedMembers.has(x.id),
      ) ?? null;
    const participant = !!mentor && (m.id === youth.id || m.id === mentor.id);
    const supervisor = m.role === "Admin" || m.role === "ProgramDirector";
    const blocked =
      this.consentRequired(m.organizationId, childId) &&
      this.consentStatusName(childId) !== "Given"
        ? "consent"
        : null;
    return { youth, mentor, participant, supervisor, blocked };
  }

  private conversationRow(
    youth: Membership,
    mentor: Membership,
    messages: FakeDirectMessage[],
    me: string,
    blocked: string | null,
  ) {
    const last = messages[messages.length - 1];
    return {
      youthId: youth.id,
      youthName: youth.personName,
      mentorId: mentor.id,
      mentorName: mentor.personName,
      lastMessage: last?.body ?? null,
      lastMessageMine: last?.senderId === me,
      lastMessageAt: last?.sentAt ?? null,
      unread: messages.filter((d) => d.senderId !== me && !d.readAt).length,
      blocked,
    };
  }

  /** GET /conversations (L2-106 criterion 1, L2-108 criterion 4). */
  private async listConversations(route: Route): Promise<void> {
    const m = await this.conversationCaller(route);
    if (!m) return;
    let rows: ReturnType<FakeApi["conversationRow"]>[] = [];
    if (m.role === "Mentor" || m.role === "Youth") {
      const youth = memberships.filter(
        (x) =>
          x.role === "Youth" &&
          x.organizationId === m.organizationId &&
          !this.removedMembers.has(x.id),
      );
      for (const y of youth) {
        const scope = this.conversationScope(m, y.id);
        if (!scope?.participant) continue;
        rows.push(
          this.conversationRow(
            y,
            scope.mentor!,
            this.conversations.of(y.id, scope.mentor!.id),
            m.id,
            scope.blocked,
          ),
        );
      }
    } else {
      const ids = [
        ...new Set(
          this.conversations.rows
            .filter((d) => d.organizationId === m.organizationId)
            .map((d) => d.youthId),
        ),
      ];
      rows = ids.map((id) => {
        const messages = this.conversations.of(id);
        const youth = memberships.find((x) => x.id === id)!;
        const mentor = memberships.find(
          (x) => x.id === messages[messages.length - 1]!.mentorId,
        )!;
        return {
          ...this.conversationRow(
            youth,
            mentor,
            messages,
            m.id,
            this.conversationScope(m, id)?.blocked ?? null,
          ),
          unread: 0,
        };
      });
    }
    rows.sort(
      (a, z) =>
        (z.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "") ||
        a.youthName.localeCompare(z.youthName),
    );
    return route.fulfill({ json: { conversations: rows } });
  }

  /** GET /conversations/{youthId}: a participant's read marks what was sent to her; a supervisor's opening is audited. */
  private async getConversation(route: Route, youthId: string): Promise<void> {
    const m = await this.conversationCaller(route);
    if (!m) return;
    const scope = this.conversationScope(m, youthId);
    if (!scope || (!scope.mentor && !scope.supervisor))
      return route.fulfill({ status: 404 });
    if (!scope.participant && !scope.supervisor)
      return route.fulfill({ status: 403, json: { code: "forbidden" } });
    const messages = scope.participant
      ? this.conversations.of(youthId, scope.mentor!.id)
      : this.conversations.of(youthId);
    if (scope.participant)
      messages
        .filter((d) => d.senderId !== m.id && !d.readAt)
        .forEach((d) => (d.readAt = NOW.toISOString()));
    else
      this.auditEntries.push({
        organizationId: m.organizationId,
        when: NOW.toISOString(),
        who: m.personName,
        action: "Viewed",
        record: "Conversation",
        summary: `${scope.youth.personName} and ${scope.mentor?.personName ?? "former mentors"}`,
        device: null,
      });
    return route.fulfill({
      json: {
        youthId,
        youthName: scope.youth.personName,
        mentorId: scope.mentor?.id ?? null,
        mentorName: scope.mentor?.personName ?? null,
        readOnly: !scope.participant,
        canSend: scope.participant && !scope.blocked,
        blocked: scope.blocked,
        messages: messages.map((d) => ({
          id: d.id,
          body: d.body,
          from: memberships.find((x) => x.id === d.senderId)?.personName ?? "",
          mine: d.senderId === m.id,
          sentAt: d.sentAt,
        })),
      },
    });
  }

  /** POST /conversations/{youthId}/messages: the youth or her mentor only, never while consent is needed; audited without the words. */
  private async sendDirectMessage(
    route: Route,
    youthId: string,
  ): Promise<void> {
    const m = await this.conversationCaller(route);
    if (!m) return;
    const scope = this.conversationScope(m, youthId);
    if (!scope) return route.fulfill({ status: 404 });
    if (!scope.participant)
      return route.fulfill({ status: 403, json: { code: "forbidden" } });
    if (scope.blocked)
      return route.fulfill({
        status: 409,
        json: { code: "blocked", blocked: scope.blocked },
      });
    const saved = await this.conversations.send(
      route,
      m.organizationId,
      youthId,
      scope.mentor!.id,
      m.id,
    );
    if (!saved) return;
    const to =
      m.id === scope.mentor!.id
        ? scope.youth.personName
        : scope.mentor!.personName;
    this.auditEntries.push({
      organizationId: m.organizationId,
      when: NOW.toISOString(),
      who: m.personName,
      action: "Created",
      record: "DirectMessage",
      summary: `Message from ${m.personName} to ${to}`,
      device: null,
    });
    this.notify(
      m.organizationId,
      [m.id === scope.mentor!.id ? youthId : scope.mentor!.id],
      "messages",
      `New message from ${m.personName}`,
      `/conversations/${youthId}`,
    );
    this.publish([youthId, scope.mentor!.id], "conversation", { youthId });
    return route.fulfill({
      status: 201,
      json: {
        id: saved.id,
        body: saved.body,
        from: m.personName,
        mine: true,
        sentAt: saved.sentAt,
      },
    });
  }

  /** The announcements a youth or mentor reads (L2-105 criterion 5): sent by now, and they are among its members. */
  private announcementsFor(m: Membership): FakeAnnouncement[] {
    return this.announcements.rows
      .filter(
        (a) =>
          a.organizationId === m.organizationId &&
          a.sendAt <= NOW.toISOString() &&
          this.announcementMembers(a).includes(m.id),
      )
      .sort((a, z) => z.sendAt.localeCompare(a.sendAt));
  }

  /** GET /announcements/mine: Messages on, youth and mentors (ReadAnnouncements). */
  private async myAnnouncements(route: Route): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Messages",
      (x) => x.role === "Youth" || x.role === "Mentor",
    );
    if (!m) return;
    const announcements = this.announcementsFor(m).map((a) =>
      this.announcements.item(a, m.id),
    );
    return route.fulfill({
      json: {
        unread: announcements.filter((a) => !a.read).length,
        announcements,
      },
    });
  }

  /** POST /announcements/mine/read: every announcement she reads, read for her alone (L2-105 criterion 6). */
  private async readMyAnnouncements(route: Route): Promise<void> {
    const m = await this.participantModuleCaller(
      route,
      "Messages",
      (x) => x.role === "Youth" || x.role === "Mentor",
    );
    if (!m) return;
    if (this.announcements.failMarkRead) return route.fulfill({ status: 500 });
    this.announcementsFor(m).forEach((a) =>
      this.announcements.reads.add(`${a.id}:${m.id}`),
    );
    return route.fulfill({ status: 204 });
  }

  /** GET /announcements: Messages on, Send messages (L2-105 criterion 7). */
  private async listAnnouncements(route: Route): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const announcements = this.announcements.rows
      .filter((a) => a.organizationId === m.organizationId)
      .sort((a, z) => z.sendAt.localeCompare(a.sendAt))
      .map((a) => this.announcements.row(a, this.announcementMembers(a)));
    return route.fulfill({ json: { announcements } });
  }

  /** POST /announcements (L2-105 criteria 1 to 4): the guardians' copy goes through Messages; audited as Created. */
  private async composeAnnouncement(route: Route): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const draft = await this.announcements.compose(
      route,
      (id) =>
        this.programs.find(
          (p) => p.id === id && p.organizationId === m.organizationId,
        )?.name,
    );
    if (!draft) return;
    let households = 0;
    const row = {
      ...draft,
      organizationId: m.organizationId,
      sentBy: m.personName,
      sentByRole: m.role,
      households: 0,
    };
    if (reachesGuardians(row as FakeAnnouncement)) {
      const { label, recipients } = this.audienceOf(m, {
        programId: draft.programId,
        eventId: null,
        language: null,
        body: draft.body,
        channel: "TextWithEmailFallback",
      });
      households = recipients.length;
      if (recipients.length && draft.sendAt <= NOW.toISOString()) {
        this.messages.unshift({
          id: `msg-${this.nextId++}`,
          organizationId: m.organizationId,
          title: draft.title,
          body: draft.body,
          sentAt: NOW.toISOString(),
          sentBy: m.personName,
          audience: label,
          channel: "TextWithEmailFallback",
          deliveries: this.deliver(m, recipients, draft.body),
        });
      }
    }
    const saved = this.announcements.add({ ...row, households });
    if (saved.sendAt <= NOW.toISOString()) {
      this.notify(
        m.organizationId,
        this.announcementMembers(saved),
        "announcements",
        `${m.personName} posted an announcement: ${saved.title}`,
        "/announcements",
      );
      this.publish(this.announcementMembers(saved), "announcement", {});
    }
    this.auditEntries.push({
      organizationId: m.organizationId,
      when: NOW.toISOString(),
      who: m.personName,
      action: "Created",
      record: "Announcement",
      summary: `${saved.title} · ${saved.program ?? "All programs"} · ${saved.audience}`,
      device: null,
    });
    return route.fulfill({ status: 201, json: { id: saved.id } });
  }

  private counts(d: FakeDelivery[]) {
    return {
      deliveredCount: d.filter(
        (x) => x.status === "Sent" || x.status === "FellBackToEmail",
      ).length,
      failedCount: d.filter((x) => x.status === "Failed").length,
      pausedCount: d.filter((x) => x.status === "Paused").length,
    };
  }

  private async listMessages(route: Route): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const { cap, used } = this.capOf(m);
    const messages = this.messages
      .filter((x) => x.organizationId === m.organizationId)
      .map((x) => ({
        id: x.id,
        title: x.title,
        sentAt: x.sentAt,
        sentBy: x.sentBy,
        recipientCount: x.deliveries.length,
        audience: x.audience,
        channel: x.channel,
        status: "Sent",
        ...this.counts(x.deliveries),
      }));
    return route.fulfill({
      json: { messages, segmentsUsed: used, segmentCap: cap },
    });
  }

  private async getMessage(route: Route, id: string): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const x = this.messages.find(
      (y) => y.id === id && y.organizationId === m.organizationId,
    );
    if (!x) return route.fulfill({ status: 404 });
    const org = organizations.find((o) => o.id === m.organizationId)!;
    const smsText = `${org.name}: ${x.body}`;
    const problem = (d: FakeDelivery) =>
      d.status === "Failed" || d.status === "Paused" ? 0 : 1;
    return route.fulfill({
      json: {
        id: x.id,
        title: x.title,
        body: x.body,
        smsText,
        characters: smsText.length,
        segments: segmentsOf(smsText),
        sentAt: x.sentAt,
        sentBy: x.sentBy,
        audience: x.audience,
        channel: x.channel,
        status: "Sent",
        recipientCount: x.deliveries.length,
        ...this.counts(x.deliveries),
        languages: [...new Set(x.deliveries.map((d) => d.language))].sort(),
        deliveries: [...x.deliveries].sort(
          (a, z) =>
            problem(a) - problem(z) || a.household.localeCompare(z.household),
        ),
      },
    });
  }

  private async smsCap(route: Route): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const { cap, used, remaining } = this.capOf(m);
    return route.fulfill({
      json: {
        cap,
        used,
        remaining,
        state: remaining === 0 ? "Reached" : "Ok",
        period: "2026-11",
      },
    });
  }

  private async reviewCaller(route: Route): Promise<Membership | null> {
    const m = await this.rosterCaller(route);
    if (!m) return null;
    if (!["Admin", "ProgramDirector"].includes(m.role)) {
      await this.forbidden(route);
      return null;
    }
    return m;
  }

  private async listEnrollmentRequests(
    route: Route,
    programId: string,
  ): Promise<void> {
    const m = await this.reviewCaller(route);
    if (!m) return;
    if (!this.ownProgram(m, programId)) return route.fulfill({ status: 404 });
    const status =
      new URL(route.request().url()).searchParams.get("status") ??
      "WaitingReview";
    const enrolledAnywhere = new Set(this.programs.flatMap((x) => x.roster));
    const requests = this.enrollmentRequests
      .filter(
        (r) => r.programId === programId && r.status === status && r.childId,
      )
      .map((r) => {
        const { child, household } = this.childrenOf(m).find(
          (x) => x.child.id === r.childId,
        )!;
        const g = this.sortedGuardians(household)[0];
        const medical = [child.medical.allergies, child.medical.medication]
          .filter(Boolean)
          .join("; ");
        return {
          id: r.id!,
          childId: child.id,
          householdId: household.id,
          child: `${child.firstName} ${child.lastName}`,
          age: ageOf(child.dateOfBirth),
          guardian: g?.name ?? "",
          phone: g?.mobile ?? null,
          language: household.language,
          medical: medical || null,
          returning: enrolledAnywhere.has(child.id),
          submittedAt: r.submittedAt!,
          status: r.status,
          position: r.position,
        };
      })
      .sort((a, z) =>
        status === "Waitlisted"
          ? (a.position ?? 0) - (z.position ?? 0)
          : a.child.localeCompare(z.child),
      );
    return route.fulfill({ json: { requests } });
  }

  /** The organization's application pipeline for one status, with the count of each (L2-072). */
  private async listApplications(route: Route): Promise<void> {
    const m = await this.reviewCaller(route);
    if (!m) return;
    const status =
      new URL(route.request().url()).searchParams.get("status") ??
      "WaitingReview";
    const own = this.enrollmentRequests.filter(
      (r) => r.id && r.childId && this.ownProgram(m, r.programId),
    );
    const count = (s: string) => own.filter((r) => r.status === s).length;
    const enrolledAnywhere = new Set(this.programs.flatMap((x) => x.roster));
    const applications = own
      .filter((r) => r.status === status)
      .map((r) => this.applicationSummary(m, r, enrolledAnywhere))
      .sort((a, z) =>
        status === "WaitingReview"
          ? z.submittedAt.localeCompare(a.submittedAt)
          : status === "Waitlisted"
            ? a.program.localeCompare(z.program) ||
              (a.position ?? 0) - (z.position ?? 0)
            : (z.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""),
      );
    return route.fulfill({
      json: {
        counts: {
          waitingReview: count("WaitingReview"),
          waitlisted: count("Waitlisted"),
          accepted: count("Accepted"),
          declined: count("Declined"),
        },
        applications,
      },
    });
  }

  private ownApplication(m: Membership, id: string) {
    return this.enrollmentRequests.find(
      (r) => r.id === id && r.childId && this.ownProgram(m, r.programId),
    );
  }

  /** One application with the family and staff notes, newest first (L2-072). */
  private async getApplication(route: Route, id: string): Promise<void> {
    const m = await this.reviewCaller(route);
    if (!m) return;
    const r = this.ownApplication(m, id);
    if (!r) return route.fulfill({ status: 404 });
    const summary = this.applicationSummary(
      m,
      r,
      new Set(this.programs.flatMap((x) => x.roster)),
    );
    const { child, household } = this.childrenOf(m).find(
      (x) => x.child.id === r.childId,
    )!;
    const g = this.sortedGuardians(household)[0];
    return route.fulfill({
      json: {
        ...summary,
        firstName: child.firstName,
        dateOfBirth: child.dateOfBirth,
        householdId: household.id,
        household: household.name,
        guardian: g
          ? {
              name: g.name,
              mobile: g.mobile,
              email: g.email,
              language: g.language,
            }
          : null,
        reason: r.reason ?? null,
        referrer: r.appliedAs === "Referrer" && r.referrer ? r.referrer : null,
        notes: [...(r.notes ?? [])].sort((a, z) =>
          z.createdAt.localeCompare(a.createdAt),
        ),
      },
    });
  }

  private async addApplicationNote(route: Route, id: string): Promise<void> {
    const m = await this.reviewCaller(route);
    if (!m) return;
    const r = this.ownApplication(m, id);
    if (!r) return route.fulfill({ status: 404 });
    const text = (
      (route.request().postDataJSON() as { text?: string | null }).text ?? ""
    ).trim();
    if (!text || text.length > 2000)
      return route.fulfill({
        status: 422,
        json: { errors: { text: "Write a note of up to 2,000 characters." } },
      });
    const note = {
      id: `note-${this.nextId++}`,
      author: m.personName,
      text,
      createdAt: new Date(NOW.getTime() + this.nextId * 1000).toISOString(),
    };
    (r.notes ??= []).push(note);
    return route.fulfill({ status: 201, json: { id: note.id } });
  }

  /** Places an open application into a cohort: it moves there, leaving its old waitlist, and is accepted (L2-072 criterion 4). */
  private async placeApplication(route: Route, id: string): Promise<void> {
    const m = await this.reviewCaller(route);
    if (!m) return;
    const r = this.ownApplication(m, id);
    if (!r) return route.fulfill({ status: 404 });
    if (r.status === "Accepted" || r.status === "Declined")
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const b = route.request().postDataJSON() as {
      programId?: string | null;
      note?: string | null;
    };
    const program = b.programId ? this.ownProgram(m, b.programId) : undefined;
    if (!program || program.status === "Archived")
      return route.fulfill({
        status: 422,
        json: { errors: { programId: "Choose a cohort." } },
      });
    if (program.roster.length + 1 > program.capacity) {
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            decision: `${program.name} is full (${program.roster.length} of ${program.capacity}). Waitlist instead.`,
          },
        },
      });
    }
    if (r.status === "Waitlisted" && r.position !== null) {
      for (const behind of this.enrollmentRequests.filter(
        (x) =>
          x.programId === r.programId &&
          x.status === "Waitlisted" &&
          (x.position ?? 0) > r.position!,
      ))
        behind.position = behind.position! - 1;
    }
    r.programId = program.id;
    r.position = null;
    r.status = "Accepted";
    r.note = b.note?.trim() || null;
    r.reviewedBy = m.personName;
    r.reviewedAt = NOW.toISOString();
    if (!program.roster.includes(r.childId!)) program.roster.push(r.childId!);
    return route.fulfill({ status: 204 });
  }

  private applicationSummary(
    m: Membership,
    r: (typeof this.enrollmentRequests)[number],
    enrolledAnywhere: Set<string>,
  ) {
    const { child, household } = this.childrenOf(m).find(
      (x) => x.child.id === r.childId,
    )!;
    const program = this.programs.find((p) => p.id === r.programId)!;
    const appliedAs = r.appliedAs ?? "Guardian";
    return {
      id: r.id!,
      childId: child.id,
      child: `${child.firstName} ${child.lastName}`,
      age: ageOf(child.dateOfBirth),
      appliedAs,
      appliedBy:
        r.submittedBy ?? this.sortedGuardians(household)[0]?.name ?? "",
      referrerRole: r.referrer?.role ?? null,
      programId: program.id,
      program: program.name,
      submittedAt: r.submittedAt!,
      status: r.status,
      position: r.position,
      seasonConsent: r.seasonConsent ?? true,
      returning: enrolledAnywhere.has(child.id) && r.status !== "Accepted",
      reviewedBy: r.reviewedBy ?? null,
      reviewedAt: r.reviewedAt ?? null,
      note: r.note ?? null,
    };
  }

  private async reviewEnrollments(
    route: Route,
    id: string | null,
  ): Promise<void> {
    const m = await this.reviewCaller(route);
    if (!m) return;
    const b = route.request().postDataJSON() as {
      ids?: string[];
      decision: "Accept" | "Waitlist" | "Decline";
      note?: string | null;
    };
    const ids = id ? [id] : (b.ids ?? []);
    const requests = this.enrollmentRequests.filter(
      (r) => r.id && ids.includes(r.id) && this.ownProgram(m, r.programId),
    );
    if (!requests.length || requests.length !== ids.length)
      return route.fulfill({ status: 404 });
    if (
      requests.some(
        (r) =>
          r.status === "Accepted" ||
          r.status === "Declined" ||
          (b.decision === "Waitlist" && r.status === "Waitlisted"),
      )
    )
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const note = b.note?.trim() || null;
    if (b.decision === "Decline" && !note)
      return route.fulfill({
        status: 422,
        json: { errors: { note: "Write a reason the guardian will read." } },
      });
    const program = this.programs.find((x) => x.id === requests[0]!.programId)!;
    if (
      b.decision === "Accept" &&
      program.roster.length + requests.length > program.capacity
    ) {
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            decision: `${program.name} is full (${program.roster.length} of ${program.capacity}). Waitlist instead.`,
          },
        },
      });
    }
    let position = Math.max(
      0,
      ...this.enrollmentRequests
        .filter((r) => r.programId === program.id && r.status === "Waitlisted")
        .map((r) => r.position ?? 0),
    );
    for (const r of requests) {
      const leftPlace = r.status === "Waitlisted" ? r.position : null;
      if (leftPlace !== null) {
        for (const behind of this.enrollmentRequests.filter(
          (x) =>
            x.programId === program.id &&
            x.status === "Waitlisted" &&
            (x.position ?? 0) > leftPlace,
        ))
          behind.position = behind.position! - 1;
        position--;
      }
      if (b.decision === "Accept") {
        r.status = "Accepted";
        if (!program.roster.includes(r.childId!))
          program.roster.push(r.childId!);
      } else if (b.decision === "Waitlist") {
        r.status = "Waitlisted";
        r.position = ++position;
      } else {
        r.status = "Declined";
      }
      r.note = note;
      r.reviewedBy = m.personName;
      r.reviewedAt = NOW.toISOString();
    }
    return route.fulfill({ status: 204 });
  }

  private async openEnrollmentRoute(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    if (!this.ownProgram(m, id)) return route.fulfill({ status: 404 });
    return route.fulfill({
      json: {
        url: `http://localhost:4317/g/enroll/${this.openEnrollment(id)}`,
      },
    });
  }

  private async closeEnrollmentRoute(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    const program = this.ownProgram(m, id);
    if (!program) return route.fulfill({ status: 404 });
    program.enrollmentOpen = false;
    return route.fulfill({ status: 204 });
  }

  /** Resolves an enrollment link like the server: the program, and 404 when Roster is off. */
  private async enrollScope(route: Route, slug: string) {
    const programId = [...this.enrollmentSlugs.entries()].find(
      ([, s]) => s === slug,
    )?.[0];
    const program = programId
      ? this.programs.find((x) => x.id === programId)
      : undefined;
    const org = program
      ? organizations.find((o) => o.id === program.organizationId)
      : undefined;
    if (!program || !org || !this.modules.get(org.id)!.includes("Roster")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return { program, org };
  }

  private enrollContact(typed: string): string | null {
    const value = (typed ?? "").trim();
    if (value.includes("@")) return value.toLowerCase();
    const digits = value.replace(/\D/g, "").slice(-10);
    return digits.length === 10 ? digits : null;
  }

  private async enrollPage(route: Route, slug: string): Promise<void> {
    const scope = await this.enrollScope(route, slug);
    if (!scope) return;
    const { program, org } = scope;
    return route.fulfill({
      json: {
        program: program.name,
        organization: org.name,
        phone: "905-555-0100",
        open: program.enrollmentOpen,
        schedule: program.schedule,
        ages: program.ages,
        startsOn: program.startsOn,
      },
    });
  }

  private async enrollCode(route: Route, slug: string): Promise<void> {
    const scope = await this.enrollScope(route, slug);
    if (!scope) return;
    if (!scope.program.enrollmentOpen)
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const contact = this.enrollContact(
      (route.request().postDataJSON() as { contact: string }).contact,
    );
    if (!contact)
      return route.fulfill({
        status: 422,
        json: { errors: { contact: "Enter a mobile number or an email." } },
      });
    const key = `${scope.program.id}:${contact}`;
    const sent = this.enrollCodes.get(key) ?? 0;
    if (sent >= 3)
      return route.fulfill({ status: 429, json: { code: "too-many" } });
    this.enrollCodes.set(key, sent + 1);
    return route.fulfill({ status: 202 });
  }

  private async enrollVerify(route: Route, slug: string): Promise<void> {
    const scope = await this.enrollScope(route, slug);
    if (!scope) return;
    const b = route.request().postDataJSON() as {
      contact: string;
      code: string;
    };
    const contact = this.enrollContact(b.contact);
    if (!contact || b.code !== this.guardianCode)
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            code: "That code didn’t work. Check the latest text or email.",
          },
        },
      });
    const household = this.households.find(
      (h) =>
        h.organizationId === scope.org.id &&
        h.guardians.some((g) =>
          contact.includes("@")
            ? g.email?.toLowerCase() === contact
            : g.mobile?.replace(/\D/g, "") === contact,
        ),
    );
    this.enrollSession = {
      programId: scope.program.id,
      contact,
      householdId: household?.id ?? null,
      draft: null,
      submitted: false,
    };
    return route.fulfill({ status: 204 });
  }

  private async enrollSessionFor(route: Route, slug: string) {
    const scope = await this.enrollScope(route, slug);
    if (!scope) return null;
    if (
      !this.enrollSession ||
      this.enrollSession.programId !== scope.program.id
    ) {
      await route.fulfill({
        status: 401,
        json: { code: "verification-required" },
      });
      return null;
    }
    return { ...scope, session: this.enrollSession };
  }

  private async enrollDraft(route: Route, slug: string): Promise<void> {
    const found = await this.enrollSessionFor(route, slug);
    if (!found) return;
    const { program, session } = found;
    const code = (language: string | null) =>
      language === "Spanish" ? "es" : language === "French" ? "fr" : "en";
    if (session.draft) {
      return route.fulfill({
        json: {
          returning: !!session.householdId,
          language: code(session.draft.household.language),
          program: program.name,
          contact: this.enrollDisplay(session.contact),
          applyingAs: "Guardian",
          ...session.draft,
        },
      });
    }
    const household = session.householdId
      ? this.households.find((h) => h.id === session.householdId)
      : undefined;
    if (household) {
      const g = this.sortedGuardians(household)[0]!;
      return route.fulfill({
        json: {
          returning: true,
          language: code(household.language),
          program: program.name,
          contact: this.enrollDisplay(session.contact),
          applyingAs: "Guardian",
          household: {
            guardianName: g.name,
            mobile: g.mobile,
            email: g.email,
            language: household.language,
          },
          children: [...household.children]
            .sort((a, z) => a.firstName.localeCompare(z.firstName))
            .map((c) => ({
              id: c.id,
              firstName: c.firstName,
              lastName: c.lastName,
              dateOfBirth: c.dateOfBirth,
              school: c.school,
              allergies: c.medical.allergies,
              medication: c.medical.medication,
              enroll: true,
            })),
        },
      });
    }
    const phone = session.contact.includes("@")
      ? null
      : `${session.contact.slice(0, 3)}-${session.contact.slice(3, 6)}-${session.contact.slice(6)}`;
    return route.fulfill({
      json: {
        returning: false,
        language: "en",
        program: program.name,
        contact: this.enrollDisplay(session.contact),
        applyingAs: "Guardian",
        household: {
          guardianName: null,
          mobile: phone,
          email: phone ? null : session.contact,
          language: "English",
        },
        children: [],
      },
    });
  }

  private enrollDisplay(contact: string): string {
    return contact.includes("@")
      ? contact
      : `${contact.slice(0, 3)}-${contact.slice(3, 6)}-${contact.slice(6)}`;
  }

  /** Whole years from a date of birth to the fake's today. */
  private enrollAge(dateOfBirth: string): number {
    const [y, m, d] = dateOfBirth.split("-").map(Number) as [
      number,
      number,
      number,
    ];
    const today = NOW;
    let age = today.getUTCFullYear() - y;
    if (
      today.getUTCMonth() + 1 < m ||
      (today.getUTCMonth() + 1 === m && today.getUTCDate() < d)
    )
      age--;
    return age;
  }

  /** The server's draft rules (L2-013 criterion 6, L2-071 criteria 2 to 4 and 11). */
  private enrollErrors(draft: FakeEnrollDraft): Record<string, string> {
    const errors: Record<string, string> = {};
    const applying = draft.applyingAs ?? "Guardian";
    if (!["Guardian", "Youth", "Referrer"].includes(applying))
      return { applyingAs: "Choose who is applying." };
    const children = draft.children ?? [];
    if (!draft.household?.mobile?.trim() && !draft.household?.email?.trim())
      errors["mobile"] = "Add a mobile number or an email.";
    if (applying === "Guardian") {
      if (!draft.household?.guardianName?.trim())
        errors["guardianName"] = "Enter your full name.";
      if (!children.some((c) => c.enroll))
        errors["children"] = "Add at least one child.";
      children.forEach((c, i) => {
        if (!c.enroll) return;
        if (!c.firstName?.trim() || !c.lastName?.trim())
          errors[`children[${i}].name`] =
            "Enter the child’s first and last name.";
        if (!c.dateOfBirth)
          errors[`children[${i}].dateOfBirth`] =
            "Enter the child’s date of birth.";
      });
      return errors;
    }
    const youth = applying === "Youth";
    if (!draft.household?.guardianName?.trim())
      errors["guardianName"] = youth
        ? "Enter your parent or guardian’s name."
        : "Enter their parent or guardian’s name.";
    if (children.filter((c) => c.enroll).length > 1)
      errors["children"] = "Apply for one young person at a time.";
    const person = children.find((c) => c.enroll);
    if (!person?.firstName?.trim() || !person?.lastName?.trim())
      errors["children[0].name"] =
        "Enter the young person’s first and last name.";
    else if (
      person.firstName.trim().length > 100 ||
      person.lastName.trim().length > 100
    )
      errors["children[0].name"] = "Keep each name under 100 characters.";
    if (!person?.dateOfBirth)
      errors["children[0].dateOfBirth"] =
        "Enter the young person’s date of birth.";
    else if (
      youth &&
      (this.enrollAge(person.dateOfBirth) < 12 ||
        this.enrollAge(person.dateOfBirth) > 18)
    )
      errors["children[0].dateOfBirth"] =
        "Young people aged 12 to 18 can apply for themselves. Ask a parent or guardian to apply for you.";
    if (!draft.reason?.trim())
      errors["reason"] = youth
        ? "Tell us why you’re interested."
        : "Tell us why you’re referring them.";
    else if (draft.reason.trim().length > 1000)
      errors["reason"] = "Keep it under 1,000 characters.";
    if (!youth) {
      const r = draft.referrer;
      if (!r?.name?.trim()) errors["referrerName"] = "Enter your full name.";
      else if (r.name.trim().length > 100)
        errors["referrerName"] = "Keep your name under 100 characters.";
      if (!r?.role?.trim())
        errors["referrerRole"] = "Tell us how you know the young person.";
      else if (r.role.trim().length > 100)
        errors["referrerRole"] = "Keep your role under 100 characters.";
      if ((r?.organization?.trim().length ?? 0) > 120)
        errors["referrerOrganization"] =
          "Keep the organization under 120 characters.";
    }
    return errors;
  }

  private async enrollSave(route: Route, slug: string): Promise<void> {
    const found = await this.enrollSessionFor(route, slug);
    if (!found) return;
    const draft = route.request().postDataJSON() as FakeEnrollDraft;
    const errors = this.enrollErrors(draft);
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    found.session.draft = draft;
    return route.fulfill({ status: 204 });
  }

  private async enrollSubmit(route: Route, slug: string): Promise<void> {
    const found = await this.enrollSessionFor(route, slug);
    if (!found) return;
    const { program, session } = found;
    if (session.submitted || !program.enrollmentOpen || !session.draft)
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const draft = session.draft;
    const appliedAs = (draft.applyingAs ?? "Guardian") as
      "Guardian" | "Youth" | "Referrer";
    const person = draft.children.find((c) => c.enroll)!;
    const seasonConsent =
      appliedAs === "Guardian" ||
      (appliedAs === "Youth" && this.enrollAge(person.dateOfBirth!) >= 18);
    if (!(route.request().postDataJSON() as { consent: boolean }).consent) {
      const consent =
        appliedAs === "Referrer"
          ? "Confirm the family agrees to be contacted."
          : !seasonConsent
            ? "Agree to the privacy notice to submit."
            : "Agree to the season consent to submit.";
      return route.fulfill({ status: 422, json: { errors: { consent } } });
    }
    const same = (a: string | null | undefined, b: string | null | undefined) =>
      (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
    const children = draft.children.filter((c) => c.enroll);
    for (const c of children) {
      const open = this.enrollmentRequests.find(
        (r) =>
          r.programId === program.id &&
          (r.status === "WaitingReview" || r.status === "Waitlisted") &&
          r.applicant &&
          same(r.applicant.firstName, c.firstName) &&
          same(r.applicant.lastName, c.lastName) &&
          r.applicant.dateOfBirth === c.dateOfBirth,
      );
      if (open)
        return route.fulfill({
          status: 409,
          json: {
            code: "duplicate",
            name: `${open.applicant!.firstName} ${open.applicant!.lastName}`,
          },
        });
    }
    let waitlisted = this.enrollmentRequests.filter(
      (r) => r.programId === program.id && r.status === "Waitlisted",
    ).length;
    let first: number | null = null;
    const referrer =
      appliedAs === "Referrer"
        ? {
            name: draft.referrer!.name!.trim(),
            role: draft.referrer!.role!.trim(),
            organization: draft.referrer?.organization?.trim() || null,
            contact: session.contact,
          }
        : null;
    for (const c of children) {
      const full = program.roster.length >= program.capacity;
      const position = full ? ++waitlisted : null;
      first ??= position;
      this.enrollmentRequests.push({
        programId: program.id,
        status: full ? "Waitlisted" : "WaitingReview",
        position,
        appliedAs,
        reason: draft.reason?.trim() || null,
        seasonConsent,
        referrer,
        applicant: {
          firstName: c.firstName.trim(),
          lastName: c.lastName.trim(),
          dateOfBirth: c.dateOfBirth,
        },
      });
    }
    session.submitted = true;
    return route.fulfill({
      json: {
        status: first === null ? "WaitingReview" : "Waitlisted",
        position: first,
        children: children.length,
        program: program.name,
        appliedAs,
        seasonConsent,
      },
    });
  }

  /** Imports need the Roster module and household writing (admins and program directors). */
  private async importCaller(route: Route): Promise<Membership | null> {
    const m = await this.rosterCaller(route);
    if (!m) return null;
    if (!can.writeHouseholds(m)) {
      await this.forbidden(route);
      return null;
    }
    return m;
  }

  /** Reads the uploaded file out of the multipart body: CSV only in the fake; anything else is refused like the server. */
  private async uploadImport(route: Route): Promise<void> {
    const m = await this.importCaller(route);
    if (!m) return;
    const raw = route.request().postDataBuffer()?.toString("utf-8") ?? "";
    const fileName = /filename="([^"]+)"/.exec(raw)?.[1] ?? "file";
    const start = raw.indexOf("\r\n\r\n") + 4;
    const end = raw.lastIndexOf("\r\n--");
    const text = raw
      .slice(start, end > start ? end : undefined)
      .replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (
      !fileName.toLowerCase().endsWith(".csv") ||
      text.includes("\u0000") ||
      lines.length === 0 ||
      !lines[0]!.includes(",")
    ) {
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            file: `We couldn’t read ${fileName}. Export it as CSV or XLSX and try again. Nothing was imported.`,
          },
        },
      });
    }
    const [header, ...rows] = lines.map((l) => l.split(","));
    const imp: FakeImport = {
      id: `imp-${this.nextId++}`,
      organizationId: m.organizationId,
      fileName,
      headers: header!.map((h) => h.trim()),
      rows,
      mapping: null,
      programId: null,
      done: false,
    };
    this.imports.push(imp);
    const columns = imp.headers.map((name, i) => ({
      name,
      sample: rows.map((r) => r[i]).find((v) => v && v.trim()) ?? null,
      field:
        IMPORT_SYNONYMS.find(([, names]) =>
          names.includes(name.toLowerCase()),
        )?.[0] ?? null,
    }));
    return route.fulfill({
      status: 201,
      json: {
        id: imp.id,
        fileName,
        rowCount: rows.length,
        matched: columns.filter((c) => c.field).length,
        columns,
      },
    });
  }

  private importRows(imp: FakeImport) {
    const value = (row: string[], field: ImportField) => {
      const column = Object.entries(imp.mapping ?? {}).find(
        ([, f]) => f === field,
      )?.[0];
      const v = column ? row[imp.headers.indexOf(column)]?.trim() : undefined;
      return v ? v : null;
    };
    return imp.rows.map((row, i) => ({
      line: i + 2,
      child: value(row, "ChildName") ?? "",
      dob: value(row, "DateOfBirth"),
      guardian: value(row, "GuardianName"),
      phone: value(row, "GuardianPhone"),
      email: value(row, "GuardianEmail"),
      cohort: value(row, "Cohort"),
      youthEmail: value(row, "YouthEmail")?.toLowerCase() ?? null,
    }));
  }

  /** The organization's active programs by name without regard to case, spacing or hyphen style (L2-130). */
  private importCohorts(m: Membership): Map<string, FakeProgram> {
    return new Map(
      this.programs
        .filter((p) => p.organizationId === m.organizationId && p.status === "Active")
        .map((p) => [this.cohortKey(p.name), p]),
    );
  }

  private cohortKey(name: string): string {
    return name
      .replace(/[\u2010-\u2014\u2212]/g, "-")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .join(" ");
  }

  /** Mirrors backend ImportRows.InvitationsAsync: why each row with a youth email is not invited, or null when it is. */
  private importInvitations(m: Membership, imp: FakeImport): Map<number, string | null> {
    const result = new Map<number, string | null>();
    const first = new Map<string, number>();
    const existing = new Map(
      this.childrenOf(m).map(({ child }) => [
        `${child.firstName} ${child.lastName}`.toLowerCase() + "|" + child.dateOfBirth,
        child,
      ]),
    );
    for (const r of this.importRows(imp)) {
      const problem = this.importProblem(r);
      if (!r.youthEmail || problem === "No child name" || problem === "No phone or email") continue;
      const child = existing.get(`${r.child.toLowerCase()}|${r.dob}`) ?? null;
      const age = ageOf(r.dob ?? child?.dateOfBirth ?? null);
      const holder = memberships.find(
        (x) => x.email === r.youthEmail && !this.removedMemberships.has(x.id),
      );
      const why = !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.youthEmail)
        ? "Enter an email like name@example.org; not invited"
        : first.has(r.youthEmail)
          ? `Used on row ${first.get(r.youthEmail)}; not invited`
          : age === null
            ? "Add a date of birth to invite; not invited"
            : age < 12 || age > 18
              ? "Youth accounts are for ages 12 to 18; not invited"
              : child && [...this.youthLinks.values()].includes(child.id)
                ? `${child.firstName} ${child.lastName} already has a youth account; not invited`
                : child && this.youthInvitationFor(child.id)
                  ? "An invitation is already waiting; not invited again"
                  : holder
                    ? `${holder.personName} already has access; not invited`
                    : null;
      if (!first.has(r.youthEmail)) first.set(r.youthEmail, r.line);
      result.set(r.line, why);
    }
    return result;
  }

  private importProblem(r: {
    child: string;
    phone: string | null;
    email: string | null;
  }): string | null {
    return !r.child
      ? "No child name"
      : !r.phone && !r.email
        ? "No phone or email"
        : !r.phone
          ? "No mobile; email only"
          : null;
  }

  private importDuplicates(m: Membership, imp: FakeImport): Set<number> {
    const existing = this.childrenOf(m).map(
      ({ child }) =>
        `${child.firstName} ${child.lastName}`.toLowerCase() +
        "|" +
        child.dateOfBirth,
    );
    return new Set(
      this.importRows(imp)
        .filter((r) => existing.includes(`${r.child.toLowerCase()}|${r.dob}`))
        .map((r) => r.line),
    );
  }

  private async mapImport(route: Route, id: string): Promise<void> {
    const m = await this.importCaller(route);
    if (!m) return;
    const imp = this.imports.find(
      (x) => x.id === id && x.organizationId === m.organizationId,
    );
    if (!imp) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      mapping: Record<string, ImportField>;
      programId: string | null;
    };
    const mapping = Object.fromEntries(
      Object.entries(b.mapping ?? {}).filter(
        ([c, f]) => imp.headers.includes(c) && f !== "Skip",
      ),
    );
    const fields = Object.values(mapping);
    const errors: Record<string, string> = {};
    if (!fields.includes("ChildName"))
      errors["ChildName"] = "Map the child’s name.";
    if (!fields.includes("GuardianName"))
      errors["GuardianName"] = "Map the guardian’s name.";
    if (!fields.includes("GuardianPhone") && !fields.includes("GuardianEmail"))
      errors["GuardianContact"] = "Map the guardian’s phone or email.";
    if (fields.includes("YouthEmail")) {
      if (!this.modules.get(m.organizationId)!.includes("Learning"))
        errors["YouthEmail"] = "Youth invitations need Learning, which is off.";
      else if (m.role !== "Admin")
        errors["YouthEmail"] = "Only an admin sends youth invitations.";
    }
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    Object.assign(imp, { mapping, programId: b.programId ?? null });
    const rows = this.importRows(imp);
    const duplicates = this.importDuplicates(m, imp);
    const cohorts = this.importCohorts(m);
    const invitations = this.importInvitations(m, imp);
    return route.fulfill({
      json: {
        rows: rows.length,
        duplicates: rows
          .filter((r) => duplicates.has(r.line))
          .map((r) => ({
            row: r.line,
            child: r.child,
            reason: "Already in PromiseHub: same name and date of birth",
          })),
        needLook: rows.flatMap((r) => {
          const problem = this.importProblem(r);
          const importable = problem !== "No child name" && problem !== "No phone or email";
          const why = invitations.get(r.line);
          return [
            ...(problem ? [{ row: r.line, child: r.child, reason: problem }] : []),
            ...(importable && r.cohort && !cohorts.has(this.cohortKey(r.cohort))
              ? [{ row: r.line, child: r.child, reason: `No cohort called “${r.cohort}”; imported, not placed` }]
              : []),
            ...(why ? [{ row: r.line, child: r.child, reason: why }] : []),
          ];
        }),
        programName:
          this.programs.find((p) => p.id === b.programId)?.name ?? null,
        placements: rows.filter(
          (r) =>
            !["No child name", "No phone or email"].includes(this.importProblem(r) ?? "") &&
            r.cohort &&
            cohorts.has(this.cohortKey(r.cohort)),
        ).length,
        invitations: [...invitations.values()].filter((v) => v === null).length,
      },
    });
  }

  private async runImport(route: Route, id: string): Promise<void> {
    const m = await this.importCaller(route);
    if (!m) return;
    const imp = this.imports.find(
      (x) => x.id === id && x.organizationId === m.organizationId,
    );
    if (!imp) return route.fulfill({ status: 404 });
    if (imp.done || !imp.mapping)
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const merge = new Set(
      (route.request().postDataJSON() as { merge: number[] }).merge ?? [],
    );
    const duplicates = this.importDuplicates(m, imp);
    const created = new Set<string>();
    const updated = new Set<string>();
    const toFix: { row: number; child: string; reason: string }[] = [];
    let imported = 0;
    let children = 0;
    let skipped = 0;
    let enrolled = 0;
    const cohorts = this.importCohorts(m);
    const inviting =
      Object.values(imp.mapping).includes("YouthEmail") &&
      this.modules.get(m.organizationId)!.includes("Learning");
    const invitations = inviting ? this.importInvitations(m, imp) : new Map<number, string | null>();
    const notPlaced: { row: number; child: string; reason: string }[] = [];
    const notInvited: { row: number; child: string; reason: string }[] = [];
    let invited = 0;
    for (const r of this.importRows(imp)) {
      const problem = this.importProblem(r);
      if (problem === "No child name" || problem === "No phone or email") {
        toFix.push({ row: r.line, child: r.child, reason: problem });
        continue;
      }
      if (duplicates.has(r.line) && !merge.has(r.line)) {
        skipped++;
        continue;
      }
      const onFile = this.households.find(
        (h) =>
          h.organizationId === m.organizationId &&
          h.guardians.some((g) => g.mobile && r.phone && g.mobile === r.phone),
      );
      if (onFile) updated.add(onFile.id);
      else created.add(r.phone ?? r.email ?? r.guardian ?? r.child);
      if (!duplicates.has(r.line)) children++;
      const match = r.cohort ? cohorts.get(this.cohortKey(r.cohort)) : undefined;
      if (r.cohort && !match)
        notPlaced.push({ row: r.line, child: r.child, reason: `No cohort called “${r.cohort}”; imported, not placed` });
      const target = r.cohort ? (match?.id ?? null) : imp.programId;
      // A merged child already on the program is not enrolled again (mirrors the backend's check).
      if (target && !duplicates.has(r.line)) enrolled++;
      if (invitations.has(r.line)) {
        const why = invitations.get(r.line);
        if (why) notInvited.push({ row: r.line, child: r.child, reason: why });
        else {
          invited++;
          this.invitations.push({
            id: `inv-${this.nextId++}`,
            organizationId: m.organizationId,
            email: r.youthEmail!,
            role: "Youth",
            invitedBy: m.personName,
            withdrawn: false,
            childName: r.child,
          });
        }
      }
      imported++;
    }
    imp.done = true;
    return route.fulfill({
      json: {
        fileName: imp.fileName,
        rows: imp.rows.length,
        imported,
        familiesCreated: created.size,
        familiesUpdated: updated.size,
        children,
        enrolled,
        skipped,
        needFix: toFix.length,
        toFix,
        programName:
          this.programs.find((p) => p.id === imp.programId)?.name ?? null,
        invited,
        notPlaced,
        notInvited,
      },
    });
  }

  private guardianLanguage(language: string): string {
    return language === "Spanish" ? "es" : language === "French" ? "fr" : "en";
  }

  /** Resolves a guardian link like the server: gone, module off, verification needed, or the page's data. */
  private async incidentCaller(route: Route): Promise<Membership | null> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      await this.unauthenticated(route);
      return null;
    }
    if (!this.modules.get(m.organizationId)!.includes("Incidents")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return m;
  }

  private readableIncidents(m: Membership) {
    const log = ["Admin", "ProgramDirector"].includes(m.role);
    return this.incidents.filter(
      (i) =>
        i.organizationId === m.organizationId && (log || i.reporterId === m.id),
    );
  }

  private childName(id: string): string {
    const c = this.households
      .flatMap((h) => h.children)
      .find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : "";
  }

  private async listIncidents(route: Route): Promise<void> {
    const m = await this.incidentCaller(route);
    if (!m) return;
    const incidents = this.readableIncidents(m).map((i) => ({
      id: i.id,
      category: i.category,
      child: this.childName(i.childId),
      occurredAt: i.occurredAt,
      severity: i.severity,
      status: i.status,
      reportedBy: i.reportedBy,
    }));
    return route.fulfill({
      json: {
        canReadLog: ["Admin", "ProgramDirector"].includes(m.role),
        incidents,
      },
    });
  }

  private async incidentForm(route: Route): Promise<void> {
    const m = await this.incidentCaller(route);
    if (!m) return;
    const supervisor =
      memberships
        .filter(
          (x) =>
            x.organizationId === m.organizationId &&
            x.role === "ProgramDirector",
        )
        .map((x) => x.personName)
        .sort()[0] ?? null;
    const children = this.households
      .filter((h) => h.organizationId === m.organizationId)
      .flatMap((h) => h.children)
      .map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))
      .sort((a, z) => a.name.localeCompare(z.name));
    return route.fulfill({ json: { supervisor, children } });
  }

  private async getIncident(route: Route, id: string): Promise<void> {
    const m = await this.incidentCaller(route);
    if (!m) return;
    const i = this.readableIncidents(m).find((x) => x.id === id);
    if (!i) return route.fulfill({ status: 404 });
    i.trail = [
      ...(i.trail ?? [
        { text: `${i.reportedBy} submitted the report`, at: i.reportedAt },
      ]),
      { text: `${m.personName} opened the report`, at: NOW.toISOString() },
    ];
    const { organizationId: _, reporterId: __, ...rest } = i;
    return route.fulfill({
      json: {
        ...rest,
        review: i.review ?? null,
        followUps: i.followUps ?? [],
        child: this.childName(i.childId),
        canReview: ["Admin", "ProgramDirector"].includes(m.role),
      },
    });
  }

  private async createIncident(route: Route): Promise<void> {
    const m = await this.incidentCaller(route);
    if (!m) return;
    const b = route.request().postDataJSON() as Record<string, string | null>;
    const errors: Record<string, string> = {};
    if (!b["category"]) errors["category"] = "Choose the type.";
    const child = this.households
      .filter((h) => h.organizationId === m.organizationId)
      .flatMap((h) => h.children)
      .find((c) => c.id === b["childId"]);
    if (!child) errors["childId"] = "Choose the child involved.";
    if (!b["occurredAt"]) errors["occurredAt"] = "Enter when it happened.";
    if (!b["whatHappened"]?.trim())
      errors["whatHappened"] = "Describe what happened.";
    if (!b["actionTaken"]?.trim())
      errors["actionTaken"] = "Describe what you did.";
    if (!b["guardianContact"])
      errors["guardianContact"] = "Say whether the guardian was contacted.";
    if (!b["severity"]) errors["severity"] = "Choose the severity.";
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const id = `inc-${this.nextId++}`;
    this.notifyIncident(m, id, child!.id, b["category"]!);
    this.incidents.push({
      id,
      organizationId: m.organizationId,
      reporterId: m.id,
      reportedBy: m.personName,
      category: b["category"]!,
      childId: child!.id,
      occurredAt: new Date(b["occurredAt"]!).toISOString(),
      place: b["place"] || "Other",
      whatHappened: b["whatHappened"]!.trim(),
      actionTaken: b["actionTaken"]!.trim(),
      guardianContact: b["guardianContact"]!,
      severity: b["severity"]!,
      status: "NeedsReview",
      reportedAt: NOW.toISOString(),
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  private async incidentSupervisor(route: Route, id: string) {
    const m = await this.incidentCaller(route);
    if (!m) return null;
    if (!["Admin", "ProgramDirector"].includes(m.role)) {
      await this.forbidden(route);
      return null;
    }
    const i = this.readableIncidents(m).find((x) => x.id === id);
    if (!i) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return { m, i };
  }

  private async reviewIncident(route: Route, id: string): Promise<void> {
    const found = await this.incidentSupervisor(route, id);
    if (!found) return;
    const { m, i } = found;
    if (i.status === "Closed")
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const b = route.request().postDataJSON() as {
      note?: string;
      outcome?: string;
    };
    if (!b.note?.trim())
      return route.fulfill({
        status: 422,
        json: { errors: { note: "Write a review note." } },
      });
    i.review = {
      note: b.note.trim(),
      outcome: b.outcome ?? "ClosedNoAction",
      by: m.personName,
      at: NOW.toISOString(),
    };
    i.status = b.outcome === "KeepOpen" ? "Open" : "Closed";
    return route.fulfill({ status: 204 });
  }

  private async reopenIncident(route: Route, id: string): Promise<void> {
    const found = await this.incidentSupervisor(route, id);
    if (!found) return;
    if (found.i.status !== "Closed")
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    found.i.status = "Open";
    return route.fulfill({ status: 204 });
  }

  private async addIncidentNote(route: Route, id: string): Promise<void> {
    const m = await this.incidentCaller(route);
    if (!m) return;
    const i = this.readableIncidents(m).find((x) => x.id === id);
    if (!i) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as { text?: string };
    if (!b.text?.trim())
      return route.fulfill({
        status: 422,
        json: { errors: { text: "Write the follow-up." } },
      });
    i.followUps = [
      ...(i.followUps ?? []),
      { text: b.text.trim(), by: m.personName, at: NOW.toISOString() },
    ];
    return route.fulfill({ status: 204 });
  }

  /** A slip link or a home link: either picks the household. */
  private linkOf(token: string): { householdId: string } | undefined {
    const home = this.homeLinks.get(token);
    return home
      ? { householdId: home }
      : (this.guardianLinks.get(token) ??
          this.surveyLinks.get(token) ??
          this.consentLinks.get(token));
  }

  private async guardianHome(route: Route, token: string): Promise<void> {
    const householdId = this.homeLinks.get(token);
    const household = householdId
      ? this.households.find((h) => h.id === householdId)
      : undefined;
    const org = household
      ? organizations.find((o) => o.id === household.organizationId)!
      : undefined;
    if (!household || !org)
      return route.fulfill({
        status: 410,
        json: { code: "link-expired", organization: null, phone: null },
      });
    if (!this.modules.get(org.id)!.includes("Roster"))
      return route.fulfill({ status: 404 });
    if (!this.trustedHouseholds.has(household.id)) {
      const contacts = household.guardians
        .filter((g) => g.mobile)
        .map((g) => `•••-•••-${g.mobile!.slice(-4)}`);
      return route.fulfill({
        status: 401,
        json: {
          code: "verification-required",
          language: this.guardianLanguage(household.language),
          organization: org.name,
          phone: "905-555-0100",
          contacts,
        },
      });
    }
    const label = {
      Accepted: "Enrolled",
      Waitlisted: "Waitlisted",
      Declined: "Declined",
      WaitingReview: "WaitingReview",
    } as const;
    const children = [...household.children]
      .sort((a, z) => a.firstName.localeCompare(z.firstName))
      .map((c) => {
        const requests = this.enrollmentRequests.filter(
          (r) => r.childId === c.id,
        );
        const fromRequests = requests.map((r) => ({
          program: this.programs.find((x) => x.id === r.programId)!,
          status: label[r.status],
          position: r.position,
          note: r.note ?? null,
        }));
        const onRoster = this.programs
          .filter(
            (x) =>
              x.roster.includes(c.id) &&
              !requests.some((r) => r.programId === x.id),
          )
          .map((program) => ({
            program,
            status: "Enrolled",
            position: null,
            note: null,
          }));
        return {
          id: c.id,
          allergies: c.medical.allergies,
          medication: c.medical.medication,
          pickups: this.modules.get(org.id)!.includes("Pickup")
            ? this.activePickups(c.id).map((x) => ({
                id: x.id,
                name: x.name,
                relationship: x.relationship,
              }))
            : null,
          name: `${c.firstName} ${c.lastName}`,
          firstName: c.firstName,
          programs: this.programs
            .filter((x) => x.status === "Active" && x.roster.includes(c.id))
            .map((x) => x.name)
            .sort(),
          enrollments: [...fromRequests, ...onRoster]
            .map((e) => ({
              program: e.program.name,
              status: e.status,
              position: e.position,
              note: e.note,
              startsOn: e.program.startsOn,
              schedule: e.program.schedule,
            }))
            .sort((a, z) => a.program.localeCompare(z.program)),
        };
      });
    const primary = this.sortedGuardians(household)[0];
    return route.fulfill({
      json: {
        language: this.guardianLanguage(household.language),
        organization: org.name,
        phone: "905-555-0100",
        firstName: primary?.name.split(" ")[0] ?? "",
        children,
        noShows: this.openNoShows(household),
        contact: primary
          ? {
              name: primary.name,
              mobile: primary.mobile,
              email: primary.email,
              language: household.language,
            }
          : null,
        announcements: this.modules.get(org.id)!.includes("Messages")
          ? this.announcementsOf(household.id).filter((a) => !a.read).length
          : null,
        pickupRequests: this.pickupRequests
          .filter(
            (r) => r.householdId === household.id && r.status === "Pending",
          )
          .map((r) => ({
            id: r.id,
            child: household.children.find((c) => c.id === r.childId)!
              .firstName,
            collector: r.collector,
            event: this.events.find((x) => x.id === r.eventId)?.name ?? "",
            requestedAt: NOW.toISOString(),
          })),
      },
    });
  }

  /** The household of a home link, as the guardian portal's pages resolve it: 410, 404 with Roster off, 401 until the device verifies. */
  private async homeScope(route: Route, token: string) {
    const householdId = this.homeLinks.get(token);
    const household = householdId
      ? this.households.find((h) => h.id === householdId)
      : undefined;
    const org = household
      ? organizations.find((o) => o.id === household.organizationId)!
      : undefined;
    if (!household || !org) {
      await route.fulfill({
        status: 410,
        json: { code: "link-expired", organization: null, phone: null },
      });
      return null;
    }
    if (!this.modules.get(org.id)!.includes("Roster")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    if (!this.trustedHouseholds.has(household.id)) {
      const contacts = household.guardians
        .filter((g) => g.mobile)
        .map((g) => `•••-•••-${g.mobile!.slice(-4)}`);
      await route.fulfill({
        status: 401,
        json: {
          code: "verification-required",
          language: this.guardianLanguage(household.language),
          organization: org.name,
          phone: "905-555-0100",
          contacts,
        },
      });
      return null;
    }
    return { household, org };
  }

  /** GET /g/home/{token}/children/{childId}: one child of the link's household, read only (L2-102, L2-104). */
  private async guardianChild(
    route: Route,
    token: string,
    childId: string,
  ): Promise<void> {
    const scope = await this.homeScope(route, token);
    if (!scope) return;
    const { household, org } = scope;
    const child = household.children.find((c) => c.id === childId);
    if (!child) return route.fulfill({ status: 404 });
    const programs = this.programs.filter(
      (x) =>
        x.organizationId === org.id &&
        x.status === "Active" &&
        x.roster.includes(child.id),
    );
    const programIds = programs.map((x) => x.id);
    const until = NOW.getTime() + 28 * 86_400_000;
    const today = hamiltonDay(NOW.toISOString());
    const coming = this.events
      .filter(
        (e) =>
          programIds.includes(e.programId) &&
          new Date(e.endsAt) > NOW &&
          new Date(e.startsAt).getTime() <= until &&
          e.status !== "Ended",
      )
      .sort((a, z) => a.startsAt.localeCompare(z.startsAt));
    const youth = [...this.youthLinks].some(
      ([membershipId, linked]) =>
        linked === child.id &&
        memberships.some(
          (m) =>
            m.id === membershipId &&
            m.organizationId === org.id &&
            !this.removedMembers.has(m.id),
        ),
    );
    const latest = this.consentOf(child.id);
    const participation =
      youth && (latest || this.consentRequired(org.id, child.id))
        ? {
            status: this.consentStatusName(child.id),
            signedBy: latest?.signedBy ?? null,
            relationship: latest?.relationship ?? null,
            signedAt: latest?.signedAt ?? null,
            reference: latest?.reference ?? null,
            withdrawnAt: latest?.withdrawnAt ?? null,
            withdrawnBy: latest?.withdrawnBy ?? null,
          }
        : null;
    const slips = this.modules.get(org.id)!.includes("Slips")
      ? coming
          .filter((e) => this.slips.get(e.id)?.status === "Sent")
          .map((e) => {
            const slip = this.slips.get(e.id)!;
            const answer = slip.answers.get(child.id);
            const current =
              answer && answer.version === slip.version ? answer : null;
            return {
              eventId: e.id,
              event: e.name,
              startsAt: e.startsAt,
              signBy: slip.signBy,
              status: current?.status ?? "NotSigned",
              signedBy: current?.by ?? null,
              at: current ? NOW.toISOString() : null,
            };
          })
      : null;
    return route.fulfill({
      json: {
        language: this.guardianLanguage(household.language),
        organization: org.name,
        phone: "905-555-0100",
        name: `${child.firstName} ${child.lastName}`,
        firstName: child.firstName,
        programs: programs.map((x) => x.name).sort(),
        schedule: coming.map((e) => ({
          eventId: e.id,
          name: e.name,
          program: programs.find((x) => x.id === e.programId)!.name,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          place: e.place,
          status: e.status === "Cancelled" ? "Cancelled" : "Scheduled",
          today: hamiltonDay(e.startsAt) === today,
        })),
        consents: { participation, slips },
        attendance: this.modules.get(org.id)!.includes("RollCall")
          ? this.guardianAttendance(org.id, child.id)
          : null,
        learning: this.modules.get(org.id)!.includes("Learning")
          ? this.guardianLearning(org.id, child.id)
          : null,
      },
    });
  }

  /** The Messages-module messages delivered to a household, newest first, with read flags (L2-103). Slip texts are not announcements. */
  private announcementsOf(householdId: string) {
    return this.messages
      .filter((m) => !m.title.startsWith("Permission slip:"))
      .flatMap((m) => {
        const mine = m.deliveries.filter(
          (d) => d.householdId === householdId && d.at,
        );
        return mine.length
          ? [
              {
                id: m.id,
                title: m.title,
                body: m.body,
                from: m.sentBy,
                sentAt: mine[0]!.at!,
                read: mine.every((d) => d.readAt),
                deliveries: mine,
              },
            ]
          : [];
      })
      .sort((a, z) => z.sentAt.localeCompare(a.sentAt));
  }

  /** GET /g/home/{token}/announcements: Roster and Messages on, a verified device (L2-103). */
  private async guardianAnnouncements(
    route: Route,
    token: string,
  ): Promise<void> {
    const scope = await this.homeScope(route, token);
    if (!scope) return;
    if (!this.modules.get(scope.org.id)!.includes("Messages"))
      return route.fulfill({ status: 404 });
    const items = this.announcementsOf(scope.household.id).map(
      ({ deliveries: _, ...a }) => a,
    );
    return route.fulfill({
      json: {
        language: this.guardianLanguage(scope.household.language),
        organization: scope.org.name,
        phone: "905-555-0100",
        unread: items.filter((a) => !a.read).length,
        announcements: items,
      },
    });
  }

  /** POST /g/home/{token}/announcements/read: every delivery to the household is read (L2-103 criterion 3). */
  private async markAnnouncementsRead(
    route: Route,
    token: string,
  ): Promise<void> {
    const scope = await this.homeScope(route, token);
    if (!scope) return;
    if (!this.modules.get(scope.org.id)!.includes("Messages"))
      return route.fulfill({ status: 404 });
    for (const a of this.announcementsOf(scope.household.id))
      for (const d of a.deliveries) d.readAt ??= NOW.toISOString();
    return route.fulfill({ status: 204 });
  }

  /** A child's marks for the guardian page: counts and the five most recent sessions (L2-102 criterion 3). */
  private guardianAttendance(organizationId: string, childId: string) {
    const rows = this.events
      .filter((e) => e.organizationId === organizationId)
      .flatMap((e) => {
        const r = this.attendance.get(e.id)?.get(childId);
        if (!r || r.status === "NotYet") return [];
        const status =
          r.status === "Absent"
            ? r.excused
              ? "Excused"
              : "Absent"
            : r.late
              ? "Late"
              : "Present";
        return [{ eventId: e.id, name: e.name, startsAt: e.startsAt, status }];
      })
      .sort((a, z) => z.startsAt.localeCompare(a.startsAt));
    const count = (s: string) => rows.filter((r) => r.status === s).length;
    return {
      present: count("Present"),
      late: count("Late"),
      excused: count("Excused"),
      absent: count("Absent"),
      recent: rows.slice(0, 5),
    };
  }

  /** The youth's own progress for her guardian, from the same fakes her journey reads; null without a youth account (L2-102 criterion 4). */
  private guardianLearning(organizationId: string, childId: string) {
    const m = memberships.find(
      (x) =>
        x.organizationId === organizationId &&
        this.youthLinks.get(x.id) === childId &&
        !this.removedMembers.has(x.id),
    );
    if (!m) return null;
    const programs = this.placementsOf(m);
    const tracks = this.learningState.tracks(m.id, programs);
    const badges = this.journey.badgesOf(m, programs);
    return {
      completedLessons: tracks.reduce(
        (n, t) =>
          n +
          t.modules.reduce(
            (k, x) => k + x.lessons.filter((l) => l.done).length,
            0,
          ),
        0,
      ),
      totalLessons: tracks.reduce(
        (n, t) => n + t.modules.reduce((k, x) => k + x.lessons.length, 0),
        0,
      ),
      modules: tracks.flatMap((t) =>
        t.modules.map((x) => ({
          title: x.module.title,
          track: t.track.name,
          done: x.lessons.filter((l) => l.done).length,
          total: x.lessons.length,
        })),
      ),
      badges: badges.earned.map((b) => ({ name: b.name, icon: b.icon })),
      badgeCount: badges.earned.length + badges.locked.length,
    };
  }

  /** The household's unanswered no-show texts, one per session, with the children's first names. */
  private openNoShows(household: {
    id: string;
    organizationId: string;
    children: { id: string; firstName: string }[];
  }) {
    if (!this.modules.get(household.organizationId)!.includes("RollCall"))
      return [];
    const byEvent = new Map<string, string[]>();
    for (const [key, v] of this.noShows) {
      const [eventId, childId] = key.split(":") as [string, string];
      const child = household.children.find((c) => c.id === childId);
      if (child && v.state === "TextSent")
        byEvent.set(
          eventId,
          [...(byEvent.get(eventId) ?? []), child.firstName].sort(),
        );
    }
    return [...byEvent].map(([eventId, children]) => {
      const e = this.events.find((x) => x.id === eventId)!;
      return { eventId, event: e.name, startsAt: e.startsAt, children };
    });
  }

  private async answerNoShow(route: Route, token: string): Promise<void> {
    const householdId = this.homeLinks.get(token);
    const household = householdId
      ? this.households.find((h) => h.id === householdId)
      : undefined;
    if (!household)
      return route.fulfill({ status: 410, json: { code: "link-expired" } });
    if (!this.trustedHouseholds.has(household.id))
      return route.fulfill({
        status: 401,
        json: { code: "verification-required" },
      });
    const b = route.request().postDataJSON() as {
      eventId: string;
      reply: "OnTheWay" | "Absent";
    };
    const open = household.children.filter(
      (c) => this.noShows.get(`${b.eventId}:${c.id}`)?.state === "TextSent",
    );
    if (!open.length) return route.fulfill({ status: 404 });
    for (const c of open)
      this.noShowAlert(b.eventId, c.id, b.reply, NOW.toISOString());
    return route.fulfill({ status: 204 });
  }

  private async guardianScope(route: Route, token: string) {
    const link = this.guardianLinks.get(token);
    const household = link
      ? this.households.find((h) => h.id === link.householdId)
      : undefined;
    const org = household
      ? organizations.find((o) => o.id === household.organizationId)!
      : undefined;
    const slip = link ? this.slips.get(link.eventId) : undefined;
    if (
      !link ||
      !household ||
      !org ||
      link.expired ||
      slip?.status !== "Sent"
    ) {
      await route.fulfill({
        status: 410,
        json: {
          code: "link-expired",
          organization: org?.name ?? null,
          phone: org ? "905-555-0100" : null,
        },
      });
      return null;
    }
    if (!this.modules.get(org.id)!.includes("Slips")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    if (!this.trustedHouseholds.has(household.id)) {
      const contacts = household.guardians
        .filter((g) => g.mobile)
        .map((g) => `•••-•••-${g.mobile!.slice(-4)}`);
      await route.fulfill({
        status: 401,
        json: {
          code: "verification-required",
          language: this.guardianLanguage(household.language),
          organization: org.name,
          phone: "905-555-0100",
          contacts,
        },
      });
      return null;
    }
    const child = household.children.find((c) => c.id === link.childId)!;
    const event = this.events.find((e) => e.id === link.eventId)!;
    return { link, household, org, slip, child, event };
  }

  /** A guardian consented for a child, as if signed from the consent link (L2-055). */
  giveConsent(
    childId: string,
    by = "Carmen Rivera",
    relationship = "Parent",
  ): void {
    this.consents.push({
      childId,
      signedBy: by,
      relationship,
      signedAt: NOW.toISOString(),
      reference: "GC-4F7A2C",
      withdrawnAt: null,
      withdrawnBy: null,
    });
  }

  /** The guardian withdrew the consent in force (L2-058 criterion 2). */
  withdrawConsent(childId: string, by = "Carmen Rivera"): void {
    const latest = this.consentOf(childId);
    if (latest && !latest.withdrawnAt)
      Object.assign(latest, {
        withdrawnAt: NOW.toISOString(),
        withdrawnBy: by,
      });
  }

  /** The child's latest consent, if any. */
  consentOf(childId: string) {
    return this.consents.filter((c) => c.childId === childId).at(-1) ?? null;
  }

  /** Whether a child needs consent (ADR 0046): a youth account, and under the consent age or no date of birth. */
  private consentRequired(organizationId: string, childId: string): boolean {
    const child = this.households
      .flatMap((h) => h.children)
      .find((c) => c.id === childId);
    const youth = [...this.youthLinks].some(
      ([membershipId, linked]) =>
        linked === childId &&
        memberships.some(
          (m) =>
            m.id === membershipId &&
            m.organizationId === organizationId &&
            !this.removedMembers.has(m.id),
        ),
    );
    const age = child ? ageOf(child.dateOfBirth) : null;
    return (
      !!child &&
      youth &&
      (age === null || age < this.consentPolicyOf(organizationId).consentAge)
    );
  }

  private consentStatusName(childId: string): "Needed" | "Given" | "Withdrawn" {
    const latest = this.consentOf(childId);
    return !latest ? "Needed" : latest.withdrawnAt ? "Withdrawn" : "Given";
  }

  /** GET /children/{id}/consent: any staff role of the child's organization (L2-058 criterion 3). */
  private async childConsent(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!this.ownChild(m, id)) return route.fulfill({ status: 404 });
    const latest = this.consentOf(id);
    return route.fulfill({
      json: {
        required: this.consentRequired(m.organizationId, id),
        consentAge: this.consentPolicyOf(m.organizationId).consentAge,
        status: this.consentStatusName(id),
        signedBy: latest?.signedBy ?? null,
        relationship: latest?.relationship ?? null,
        signedAt: latest?.signedAt ?? null,
        reference: latest?.reference ?? null,
        withdrawnAt: latest?.withdrawnAt ?? null,
        withdrawnBy: latest?.withdrawnBy ?? null,
        linkSentAt: this.consentLinksSent.get(id) ?? null,
      },
    });
  }

  /** POST /children/{id}/consent-request: admins and program directors (L2-058 criterion 4). */
  private async sendConsentLink(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.writeHouseholds(m)) return this.forbidden(route);
    const found = this.ownChild(m, id);
    if (!found) return route.fulfill({ status: 404 });
    return this.deliverConsentLink(
      route,
      m.organizationId,
      found.household,
      id,
    );
  }

  /** Texts the household's signers, as the server does; 409 when not needed, 422 when nobody can be reached. */
  private async deliverConsentLink(
    route: Route,
    organizationId: string,
    household: FakeHousehold,
    childId: string,
  ): Promise<void> {
    if (
      !this.consentRequired(organizationId, childId) ||
      this.consentStatusName(childId) === "Given"
    )
      return route.fulfill({ status: 409, json: { code: "not-needed" } });
    const signers = household.guardians.filter(
      (g) => g.canSign && (g.mobile || (g.email && !g.emailBounced)),
    );
    if (!signers.length)
      return route.fulfill({ status: 422, json: { code: "no-guardian" } });
    this.consentLinksSent.set(childId, NOW.toISOString());
    return route.fulfill({
      status: 202,
      json: {
        sentTo: signers.map((g) =>
          g.mobile
            ? `•••-•••-${g.mobile.slice(-4)}`
            : `${g.email![0]}•••${g.email!.slice(g.email!.indexOf("@"))}`,
        ),
      },
    });
  }

  private async consentScope(route: Route, token: string) {
    const link = this.consentLinks.get(token);
    const household = link
      ? this.households.find((h) => h.id === link.householdId)
      : undefined;
    const org = household
      ? organizations.find((o) => o.id === household.organizationId)!
      : undefined;
    if (!link || !household || !org || link.expired) {
      await route.fulfill({
        status: 410,
        json: {
          code: "link-expired",
          organization: org?.name ?? null,
          phone: org ? "905-555-0100" : null,
        },
      });
      return null;
    }
    if (!this.modules.get(org.id)!.includes("Roster")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    if (!this.trustedHouseholds.has(household.id)) {
      const contacts = household.guardians
        .filter((g) => g.mobile)
        .map((g) => `•••-•••-${g.mobile!.slice(-4)}`);
      await route.fulfill({
        status: 401,
        json: {
          code: "verification-required",
          language: this.guardianLanguage(household.language),
          organization: org.name,
          phone: "905-555-0100",
          contacts,
        },
      });
      return null;
    }
    const child = household.children.find((c) => c.id === link.childId)!;
    return { household, org, child };
  }

  /** GET /g/consent/{token}: the child, the wording and what is on record (L2-055, L2-058). */
  private async guardianConsent(route: Route, token: string): Promise<void> {
    const scope = await this.consentScope(route, token);
    if (!scope) return;
    const { household, org, child } = scope;
    const latest = this.consentOf(child.id);
    return route.fulfill({
      json: {
        language: this.guardianLanguage(household.language),
        organization: org.name,
        phone: "905-555-0100",
        guardianName:
          this.sortedGuardians(household)[0]?.name.split(" ")[0] ?? "",
        child: {
          name: `${child.firstName} ${child.lastName}`,
          firstName: child.firstName,
          age: ageOf(child.dateOfBirth),
        },
        wording: this.consentPolicyOf(org.id).wording,
        consentAge: this.consentPolicyOf(org.id).consentAge,
        status: this.consentStatusName(child.id),
        signedBy: latest?.signedBy ?? null,
        relationship: latest?.relationship ?? null,
        signedAt: latest?.signedAt ?? null,
        reference: latest?.reference ?? null,
        withdrawnAt: latest?.withdrawnAt ?? null,
        withdrawnBy: latest?.withdrawnBy ?? null,
      },
    });
  }

  /** POST /g/consent/{token}/sign: relationship, ticked box and a typed name of a guardian who may sign (L2-055). */
  private async giveConsentRoute(route: Route, token: string): Promise<void> {
    const scope = await this.consentScope(route, token);
    if (!scope) return;
    const { household, child } = scope;
    if (this.consentStatusName(child.id) === "Given")
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const b = route.request().postDataJSON() as {
      name?: string;
      relationship?: string;
      agree?: boolean;
    };
    const typed = (b.name ?? "").trim().replace(/\s+/g, " ");
    const signer = household.guardians.find(
      (g) => g.canSign && g.name.toLowerCase() === typed.toLowerCase(),
    );
    const errors: Record<string, string> = {};
    if (!b.relationship?.trim())
      errors["relationship"] =
        `Choose how you’re related to ${child.firstName}.`;
    if (!b.agree) errors["agree"] = "Tick the box to give consent.";
    if (!typed) errors["name"] = "Type your full name to sign.";
    else if (!signer)
      errors["name"] =
        `That name doesn’t match a guardian of ${child.firstName}.`;
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    this.giveConsent(child.id, signer!.name, b.relationship!.trim());
    return route.fulfill({ status: 204 });
  }

  /** POST /g/consent/{token}/withdraw: 409 with no consent in force (L2-058 criterion 2). */
  private async withdrawConsentRoute(
    route: Route,
    token: string,
  ): Promise<void> {
    const scope = await this.consentScope(route, token);
    if (!scope) return;
    if (this.consentStatusName(scope.child.id) !== "Given")
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    this.withdrawConsent(
      scope.child.id,
      this.sortedGuardians(scope.household)[0]!.name,
    );
    return route.fulfill({ status: 204 });
  }

  private async guardianCodeRoute(route: Route): Promise<void> {
    const b = route.request().postDataJSON() as {
      token: string;
      contact: string;
    };
    const link = this.linkOf(b.token);
    if (!link)
      return route.fulfill({ status: 410, json: { code: "link-expired" } });
    return route.fulfill({ status: 202 });
  }

  private async guardianVerify(route: Route): Promise<void> {
    const b = route.request().postDataJSON() as { token: string; code: string };
    const link = this.linkOf(b.token);
    if (!link)
      return route.fulfill({ status: 410, json: { code: "link-expired" } });
    if (this.lockedLinks.has(b.token))
      return route.fulfill({ status: 423, json: { code: "locked" } });
    if (b.code !== this.guardianCode) {
      const wrong = (this.wrongCodes.get(b.token) ?? 0) + 1;
      this.wrongCodes.set(b.token, wrong);
      if (wrong >= 3) this.lockedLinks.add(b.token);
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            code: "That code didn’t work. Check the latest text or email.",
          },
        },
      });
    }
    this.trustedHouseholds.add(link.householdId);
    return route.fulfill({ status: 204 });
  }

  private async guardianSlip(route: Route, token: string): Promise<void> {
    const scope = await this.guardianScope(route, token);
    if (!scope) return;
    const { household, org, slip, child, event } = scope;
    const primary = this.sortedGuardians(household)[0];
    const answer = slip.answers.get(child.id);
    const current = answer && answer.version === slip.version ? answer : null;
    return route.fulfill({
      json: {
        language: this.guardianLanguage(household.language),
        organization: org.name,
        phone: "905-555-0100",
        guardianName: primary?.name.split(" ")[0] ?? "",
        event: {
          name: event.name,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          place: event.place,
        },
        child: {
          name: `${child.firstName} ${child.lastName}`,
          firstName: child.firstName,
          age: ageOf(child.dateOfBirth),
          allergies: child.medical.allergies,
          medication: child.medical.medication,
        },
        emergencyContact: primary
          ? { name: primary.name, phone: primary.mobile }
          : null,
        title: slip.title || event.name,
        body: slip.body,
        signBy: slip.signBy,
        askPhotos: slip.askPhotos,
        askSwimming: slip.askSwimming,
        askLunch: slip.askLunch,
        status: current?.status ?? "Open",
        answeredAt: current ? NOW.toISOString() : null,
        answeredBy: current?.by ?? null,
      },
    });
  }

  private async guardianAnswer(
    route: Route,
    token: string,
    status: "Signed" | "Declined",
  ): Promise<void> {
    const scope = await this.guardianScope(route, token);
    if (!scope) return;
    const { household, slip, child } = scope;
    const current = slip.answers.get(child.id);
    if (
      current &&
      current.version === slip.version &&
      (status === "Signed" || current.status === "Declined")
    )
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const b = route.request().postDataJSON() as {
      name?: string;
      reason?: string;
    };
    const typed = (b.name ?? "").trim().replace(/\s+/g, " ");
    const signer = household.guardians.find(
      (g) => g.canSign && g.name.toLowerCase() === typed.toLowerCase(),
    );
    if (status === "Signed") {
      if (!typed)
        return route.fulfill({
          status: 422,
          json: { errors: { name: "Type your full name to sign." } },
        });
      if (!signer)
        return route.fulfill({
          status: 422,
          json: {
            errors: {
              name: `That name doesn’t match a guardian of ${child.firstName}.`,
            },
          },
        });
    }
    const by = signer?.name ?? this.sortedGuardians(household)[0]!.name;
    slip.answers.set(child.id, { status, by, version: slip.version });
    return route.fulfill({ status: 204 });
  }

  /** Families with a child still to answer the slip, as the server lists them. */
  private families(m: Membership, slip: FakeSlip, event: FakeEvent) {
    const outstanding = this.slipResponses(m, slip, event).filter(
      (r) => r.status === "Outstanding",
    );
    return this.households
      .filter((h) =>
        outstanding.some(
          (r) =>
            r.household === h.name && h.organizationId === m.organizationId,
        ),
      )
      .sort((a, z) => a.name.localeCompare(z.name))
      .map((h) => {
        const reachable = h.guardians.some(
          (g) => g.mobile || (g.email && !g.emailBounced),
        );
        return {
          householdId: h.id,
          household: h.name,
          guardian: this.sortedGuardians(h)[0]?.name ?? null,
          children: outstanding
            .filter((r) => r.household === h.name)
            .map((r) => r.child.split(" ")[0]!),
          childIds: outstanding
            .filter((r) => r.household === h.name)
            .map((r) => r.childId),
          lastRemindedAt: null as string | null,
          reachable,
          reason: reachable
            ? null
            : h.guardians.some((g) => g.emailBounced)
              ? "Email bounced, no mobile"
              : "No mobile or email",
        };
      });
  }

  private async clearance(route: Route, sessionId: string): Promise<void> {
    const m = await this.slipsCaller(route);
    if (!m) return;
    const event = this.ownEvent(m, sessionId);
    const slip = event?.requiresSlip ? this.slips.get(event.id) : undefined;
    if (!event || !slip || slip.status !== "Sent")
      return route.fulfill({ status: 404 });
    const order: Record<string, number> = {
      Missing: 0,
      Declined: 1,
      Cleared: 2,
    };
    const children = this.slipResponses(m, slip, event)
      .map((r) => ({
        childId: r.childId,
        householdId: this.households.find(
          (h) =>
            h.name === r.household && h.organizationId === m.organizationId,
        )!.id,
        name: r.child,
        status:
          r.status === "Signed"
            ? "Cleared"
            : r.status === "Declined"
              ? "Declined"
              : "Missing",
      }))
      .sort(
        (a, z) =>
          order[a.status]! - order[z.status]! || a.name.localeCompare(z.name),
      );
    return route.fulfill({
      json: {
        slipId: slip.id,
        title: slip.title || event.name,
        cleared: children.filter((c) => c.status === "Cleared").length,
        missing: children.filter((c) => c.status === "Missing").length,
        declined: children.filter((c) => c.status === "Declined").length,
        children,
      },
    });
  }

  private async unsignedFamilies(route: Route, id: string): Promise<void> {
    const m = await this.slipsCaller(route);
    if (!m) return;
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    return route.fulfill({
      json: {
        households: this.families(m, found.slip, found.event).map(
          ({ childIds: _, ...f }) => f,
        ),
      },
    });
  }

  private async remindNow(route: Route, id: string): Promise<void> {
    const m = await this.slipsCaller(route, true);
    if (!m) return;
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as { body: string };
    if (!(b.body ?? "").includes("{link}"))
      return route.fulfill({
        status: 422,
        json: { errors: { body: "Keep {link} in the message." } },
      });
    const families = this.families(m, found.slip, found.event);
    return route.fulfill({
      json: {
        households: families.filter((f) => f.reachable).length,
        unreachable: families.filter((f) => !f.reachable).length,
      },
    });
  }

  private async signOnTablet(route: Route, id: string): Promise<void> {
    const m = await this.slipsCaller(route);
    if (!m) return;
    if (!can.runSessions(m)) return this.forbidden(route);
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as {
      householdId: string;
      name: string;
    };
    const family = this.families(m, found.slip, found.event).find(
      (f) => f.householdId === b.householdId,
    );
    if (!family)
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const typed = (b.name ?? "").trim().replace(/\s+/g, " ");
    if (!typed)
      return route.fulfill({
        status: 422,
        json: {
          errors: { name: "The guardian needs to type their full name." },
        },
      });
    const household = this.households.find((h) => h.id === b.householdId)!;
    const signer = household.guardians.find(
      (g) => g.canSign && g.name.toLowerCase() === typed.toLowerCase(),
    );
    if (!signer)
      return route.fulfill({
        status: 422,
        json: {
          errors: {
            name: "That name doesn’t match a guardian of this family.",
          },
        },
      });
    for (const childId of family.childIds)
      found.slip.answers.set(childId, {
        status: "Signed",
        by: signer.name,
        version: found.slip.version,
      });
    return route.fulfill({ status: 204 });
  }

  /** An event's slip, created as a draft the first time it is read, as the server creates it with the event. */
  private slipOf(eventId: string): FakeSlip | undefined {
    const e = this.events.find((x) => x.id === eventId);
    if (!e || !e.requiresSlip) return undefined;
    if (!this.slips.has(eventId)) {
      this.slips.set(eventId, {
        id: `slip-${eventId}`,
        eventId,
        title: "",
        body: "",
        signBy: e.startsAt.slice(0, 10),
        askPhotos: true,
        askSwimming: false,
        askLunch: true,
        reminders: "TwiceWeekly",
        channel: "TextAndEmail",
        status: "Draft",
        scheduledFor: null,
        sentAt: null,
        version: 1,
        answers: new Map(),
        messageId: null,
      });
    }
    return this.slips.get(eventId);
  }

  private slipById(
    m: Membership,
    id: string,
  ): { slip: FakeSlip; event: FakeEvent } | undefined {
    const slip = [...this.slips.values()].find((x) => x.id === id);
    const event = slip ? this.ownEvent(m, slip.eventId) : undefined;
    return slip && event ? { slip, event } : undefined;
  }

  private async slipsCaller(
    route: Route,
    write = false,
  ): Promise<Membership | null> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      await this.unauthenticated(route);
      return null;
    }
    if (!this.modules.get(m.organizationId)!.includes("Slips")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    if (write && !can.manageSlips(m)) {
      await this.forbidden(route);
      return null;
    }
    return m;
  }

  private slipResponses(m: Membership, slip: FakeSlip, event: FakeEvent) {
    const program = this.programs.find((p) => p.id === event.programId)!;
    return this.childrenOf(m)
      .filter(({ child }) => program.roster.includes(child.id))
      .sort((a, z) => a.child.firstName.localeCompare(z.child.firstName))
      .map(({ child, household }) => {
        const a = slip.answers.get(child.id);
        const current = a && a.version === slip.version ? a : null;
        return {
          childId: child.id,
          child: `${child.firstName} ${child.lastName}`,
          household: household.name,
          status: current?.status ?? "Outstanding",
          signedBy: current?.by ?? null,
        };
      });
  }

  private slipDto(m: Membership, slip: FakeSlip, event: FakeEvent) {
    const responses = this.slipResponses(m, slip, event);
    const message = this.messages.find((x) => x.id === slip.messageId);
    const of = (status: FakeDelivery["status"]) =>
      (message?.deliveries ?? [])
        .filter((d) => d.status === status)
        .map((d) => d.household)
        .sort();
    return {
      id: slip.id,
      eventId: event.id,
      eventName: event.name,
      eventStartsAt: event.startsAt,
      title: slip.title || event.name,
      body: slip.body,
      signBy: slip.signBy,
      askPhotos: slip.askPhotos,
      askSwimming: slip.askSwimming,
      askLunch: slip.askLunch,
      reminders: slip.reminders,
      channel: slip.channel,
      status: slip.status,
      scheduledFor: slip.scheduledFor,
      sentAt: slip.sentAt,
      version: slip.version,
      households: new Set(responses.map((r) => r.household)).size,
      children: responses.length,
      signed: responses.filter((r) => r.status === "Signed").length,
      declined: responses.filter((r) => r.status === "Declined").length,
      outstanding: responses.filter((r) => r.status === "Outstanding").length,
      responses,
      delivery: message
        ? {
            sent: of("Sent").length,
            emailInstead: of("FellBackToEmail"),
            paused: of("Paused"),
            failed: of("Failed"),
          }
        : null,
    };
  }

  private async getSlip(route: Route, eventId: string): Promise<void> {
    const m = await this.slipsCaller(route);
    if (!m) return;
    const event = this.ownEvent(m, eventId);
    const slip = event ? this.slipOf(eventId) : undefined;
    if (!event || !slip) return route.fulfill({ status: 404 });
    return route.fulfill({ json: this.slipDto(m, slip, event) });
  }

  private async saveSlip(route: Route, eventId: string): Promise<void> {
    const m = await this.slipsCaller(route, true);
    if (!m) return;
    const event = this.ownEvent(m, eventId);
    const slip = event ? this.slipOf(eventId) : undefined;
    if (!event || !slip) return route.fulfill({ status: 404 });
    if (slip.status === "Sent")
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const b = route.request().postDataJSON() as Pick<
      FakeSlip,
      | "title"
      | "body"
      | "signBy"
      | "askPhotos"
      | "askSwimming"
      | "askLunch"
      | "reminders"
      | "channel"
    >;
    if ((b.body ?? "").trim().length > 600)
      return route.fulfill({
        status: 422,
        json: { errors: { body: "Keep it to 600 characters." } },
      });
    Object.assign(slip, {
      ...b,
      title: (b.title ?? "").trim(),
      body: (b.body ?? "").trim(),
    });
    return route.fulfill({ status: 204 });
  }

  private slipErrors(
    title: string,
    body: string,
    signBy: string,
    event: FakeEvent,
  ): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors["title"] = "Enter a slip title.";
    if (!body.trim()) errors["body"] = "Enter the slip text.";
    // Event days are in Hamilton time; the seeded events start in the afternoon UTC, so the UTC date is the local date.
    const day = event.startsAt.slice(0, 10);
    if (signBy >= day) {
      const label = new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      })
        .format(new Date(`${day}T12:00:00Z`))
        .replace(",", "");
      errors["signBy"] = `Must be before ${label}.`;
    }
    return errors;
  }

  /** Queues the slip's message to the event's households through the same path as Messages. */
  private deliverSlip(
    m: Membership,
    slip: FakeSlip,
    event: FakeEvent,
    edited: boolean,
  ): void {
    const org = organizations.find((o) => o.id === m.organizationId)!;
    const audience = this.audienceOf(m, {
      programId: null,
      eventId: event.id,
      language: null,
      body: "",
      channel:
        slip.channel === "EmailOnly" ? "EmailOnly" : "TextWithEmailFallback",
    });
    const title = slip.title || event.name;
    const body = edited
      ? `The permission slip for “${title}” has changed. Please read it and sign again.`
      : `Please sign the permission slip for “${title}”.`;
    const segments = segmentsOf(`${org.name}: ${body}`);
    const deliveries: FakeDelivery[] = audience.recipients.map((r) => {
      const base = {
        household: r.household,
        guardian: r.guardian,
        language: r.language,
        at: null as string | null,
      };
      if (r.unreachable)
        return {
          ...base,
          channel: r.channel,
          status: "Failed",
          reason: r.unreachable,
        };
      if (r.channel === "Email")
        return {
          ...base,
          channel: "Email",
          status: "Sent",
          reason: null,
          at: NOW.toISOString(),
        };
      const { remaining, used } = this.capOf(m);
      if (remaining >= segments) {
        this.smsUsed.set(m.organizationId, used + segments);
        return {
          ...base,
          channel: "Sms",
          status: "Sent",
          reason: null,
          at: NOW.toISOString(),
        };
      }
      return r.fallback
        ? {
            ...base,
            channel: "Email",
            status: "FellBackToEmail",
            reason: "SMS cap reached",
            at: NOW.toISOString(),
          }
        : {
            ...base,
            channel: "Sms",
            status: "Paused",
            reason: "SMS cap reached",
          };
    });
    const id = `msg-${this.nextId++}`;
    this.messages.unshift({
      id,
      organizationId: m.organizationId,
      title: `Permission slip: ${title}`,
      body,
      sentAt: NOW.toISOString(),
      sentBy: m.personName,
      audience: audience.label,
      channel:
        slip.channel === "EmailOnly" ? "EmailOnly" : "TextWithEmailFallback",
      deliveries,
    });
    slip.messageId = id;
    if (!edited)
      Object.assign(slip, {
        status: "Sent",
        sentAt: NOW.toISOString(),
        scheduledFor: null,
      });
    event.slipStatus = "Sent";
  }

  private async sendSlipRoute(route: Route, id: string): Promise<void> {
    const m = await this.slipsCaller(route, true);
    if (!m) return;
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const { slip, event } = found;
    if (slip.status === "Sent")
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const errors = this.slipErrors(
      slip.title || event.name,
      slip.body,
      slip.signBy,
      event,
    );
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    const b = route.request().postDataJSON() as { at?: string | null };
    if (b.at && b.at > NOW.toISOString()) {
      Object.assign(slip, { status: "Scheduled", scheduledFor: b.at });
      event.slipStatus = "Scheduled";
    } else {
      this.deliverSlip(m, slip, event, false);
    }
    return route.fulfill({ status: 204 });
  }

  private async slipTransition(
    route: Route,
    id: string,
    action: "send-now" | "cancel",
  ): Promise<void> {
    const m = await this.slipsCaller(route, true);
    if (!m) return;
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const { slip, event } = found;
    if (slip.status !== "Scheduled")
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    if (action === "send-now") {
      this.deliverSlip(m, slip, event, false);
    } else {
      Object.assign(slip, { status: "Draft", scheduledFor: null });
      event.slipStatus = "Draft";
    }
    return route.fulfill({ status: 204 });
  }

  private async editSlip(route: Route, id: string): Promise<void> {
    const m = await this.slipsCaller(route, true);
    if (!m) return;
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const { slip, event } = found;
    if (slip.status !== "Sent")
      return route.fulfill({ status: 409, json: { code: "conflict" } });
    const b = route.request().postDataJSON() as {
      title: string;
      body: string;
      signBy: string;
      material: boolean;
    };
    const errors = this.slipErrors(
      b.title ?? "",
      b.body ?? "",
      b.signBy,
      event,
    );
    if (Object.keys(errors).length)
      return route.fulfill({ status: 422, json: { errors } });
    Object.assign(slip, {
      title: b.title.trim(),
      body: b.body.trim(),
      signBy: b.signBy,
    });
    if (b.material) {
      slip.version++;
      this.deliverSlip(m, slip, event, true);
    }
    return route.fulfill({ status: 204 });
  }

  /** Today's summary from the modules that are on and the work the role may do. Mirrors backend TodayHandler. */
  private async today(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const on = this.modules.get(m.organizationId)!;
    const programs = this.programs.filter(
      (p) => p.organizationId === m.organizationId,
    );
    const ownEvents = this.events.filter(
      (e) => e.organizationId === m.organizationId,
    );
    const tomorrow = "2026-11-06T05:00:00Z";
    const horizon = "2026-11-20T05:00:00Z";
    const slipsDue = on.includes("Slips")
      ? ownEvents
          .filter(
            (e) =>
              e.requiresSlip &&
              this.slipOf(e.id)?.status === "Sent" &&
              this.slipOf(e.id)!.signBy >= "2026-11-05",
          )
          .map((e) => {
            const slip = this.slipOf(e.id)!;
            const responses = this.slipResponses(m, slip, e);
            const signed = responses.filter(
              (r) => r.status === "Signed",
            ).length;
            return {
              eventId: e.id,
              title: slip.title || e.name,
              signBy: slip.signBy,
              signed,
              expected: responses.length,
              unsigned: responses.length - signed,
            };
          })
          .sort((a, b) => a.signBy.localeCompare(b.signBy))
      : null;
    const comingUp = ownEvents
      .filter(
        (e) =>
          e.status === "Scheduled" &&
          e.startsAt >= tomorrow &&
          e.startsAt < horizon,
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map((e) => ({
        id: e.id,
        name: e.name,
        startsAt: e.startsAt,
        place: e.place,
        requiresSlip: e.requiresSlip,
      }));
    const programIds = new Set(programs.map((p) => p.id));
    const tasks = [
      on.includes("Incidents") && can.reviewIncidents(m)
        ? {
            kind: "incidents",
            count: this.incidents.filter(
              (i) =>
                i.organizationId === m.organizationId &&
                i.status === "NeedsReview",
            ).length,
          }
        : null,
      can.reviewEnrollments(m)
        ? {
            kind: "enrollments",
            count: this.enrollmentRequests.filter(
              (r) =>
                programIds.has(r.programId) && r.status === "WaitingReview",
            ).length,
          }
        : null,
      on.includes("Pickup") && can.managePickups(m)
        ? {
            kind: "pickups",
            count: this.pickupRequests.filter(
              (r) =>
                ownEvents.some((e) => e.id === r.eventId) &&
                r.status === "Pending",
            ).length,
          }
        : null,
    ].filter((t) => t && t.count > 0);
    return route.fulfill({
      json: {
        activeChildren: new Set(
          programs
            .filter((p) => p.status === "Active")
            .flatMap((p) => p.roster),
        ).size,
        households: this.households.filter(
          (h) => h.organizationId === m.organizationId,
        ).length,
        slipsDue,
        comingUp,
        tasks,
      },
    });
  }

  /** Children, households and events by name, email or phone fragment. Mirrors backend SearchHandler. */
  private async search(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const q = (new URL(route.request().url()).searchParams.get("q") ?? "")
      .trim()
      .toLowerCase();
    const slipsOn = this.modules.get(m.organizationId)!.includes("Slips");
    if (!q)
      return route.fulfill({
        json: { children: [], households: [], events: slipsOn ? [] : null },
      });
    const digits = q.replace(/\D/g, "");
    const permitted = this.permittedChildren(m);
    const own = this.households.filter(
      (h) => h.organizationId === m.organizationId,
    );
    const visible = own.filter(
      (h) => !permitted || h.children.some((c) => permitted.has(c.id)),
    );
    const children = own
      .flatMap((h) => h.children.map((c) => ({ c, h })))
      .filter(({ c }) => !permitted || permitted.has(c.id))
      .filter(({ c }) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q),
      )
      .sort((a, b) => a.c.firstName.localeCompare(b.c.firstName))
      .map(({ c, h }) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        age: ageOf(c.dateOfBirth),
        householdId: h.id,
        householdName: h.name,
      }));
    const households = visible
      .filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.guardians.some(
            (g) =>
              g.name.toLowerCase().includes(q) ||
              (g.email ?? "").toLowerCase().includes(q) ||
              (digits.length >= 3 &&
                (g.mobile ?? "").replace(/\D/g, "").includes(digits)),
          ),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((h) => {
        const gs = [...h.guardians].sort(
          (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
        );
        return {
          id: h.id,
          name: h.name,
          guardians: gs.map((g) => g.name).join(", "),
          phone: gs.find((g) => g.mobile)?.mobile ?? null,
          language: h.language,
        };
      });
    const events = slipsOn
      ? this.events
          .filter(
            (e) =>
              e.organizationId === m.organizationId &&
              e.name.toLowerCase().includes(q),
          )
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
          .map((e) => ({
            id: e.id,
            name: e.name,
            startsAt: e.startsAt,
            place: e.place,
          }))
      : null;
    return route.fulfill({ json: { children, households, events } });
  }

  /** Notifies everyone who reviews incidents in the reporter's organization. Mirrors backend NotificationWriter. */
  private notifyIncident(
    reporter: Membership,
    incidentId: string,
    childId: string,
    category: string,
  ): void {
    const child = this.households
      .flatMap((h) => h.children)
      .find((c) => c.id === childId);
    const name = child ? `${child.firstName} ${child.lastName}` : "a child";
    for (const r of memberships.filter(
      (x) =>
        x.organizationId === reporter.organizationId && can.reviewIncidents(x),
    )) {
      this.notifications.push({
        id: `n-${this.nextId++}`,
        organizationId: reporter.organizationId,
        membershipId: r.id,
        kind: "incidents",
        text: `Incident reported by ${reporter.personName}: ${name}, ${category.toLowerCase()}.`,
        link: `/incidents/${incidentId}`,
        createdAt: new Date(NOW.getTime() + this.nextId * 1000).toISOString(),
        readAt: null,
      });
    }
  }

  /** Adds a notice for each named member, as the backend NotificationWriter does (L2-109). */
  private notify(
    organizationId: string,
    membershipIds: string[],
    kind: string,
    text: string,
    link: string,
  ): void {
    const to = [...new Set(membershipIds)].filter(
      (id) => this.notificationPreferences.get(`${id}:${kind}`) !== false,
    );
    for (const membershipId of to) {
      this.notifications.push({
        id: `n-${this.nextId++}`,
        organizationId,
        membershipId,
        kind,
        text,
        link,
        createdAt: new Date(NOW.getTime() + this.nextId * 1000).toISOString(),
        readAt: null,
      });
    }
    // The save tells each recipient's open streams, as the backend NotificationEvents does (L2-110).
    if (to.length) this.publish(to, "notification", {});
  }

  /** She reads every notice on another device: her open streams are told (L2-110 criterion 3). */
  readAllNotificationsAs(membershipId: string): void {
    const m = memberships.find((x) => x.id === membershipId)!;
    for (const n of this.visibleNotifications(m))
      n.readAt ??= NOW.toISOString();
    this.publish([membershipId], "notification", {});
  }

  /** Each member's choices by `membershipId:kind`; a missing entry is on (L2-111). */
  private readonly notificationPreferences = new Map<string, boolean>();

  private offeredKinds(m: Membership) {
    const on = this.modules.get(m.organizationId)!;
    return NOTIFICATION_KINDS.filter(
      (k) =>
        k.receives(m) &&
        NOTIFICATION_MODULES[k.key]!.every((x) => on.includes(x)),
    );
  }

  /** GET /notifications/preferences: the caller's own choices. Mirrors backend NotificationPreferencesHandler. */
  private async getNotificationPreferences(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const kinds = this.offeredKinds(m).map((k) => ({
      key: k.key,
      name: k.name,
      hint: k.hint,
      inApp: this.notificationPreferences.get(`${m.id}:${k.key}`) ?? true,
    }));
    return route.fulfill({ json: { kinds } });
  }

  /** PUT /notifications/preferences: a kind the role never receives is refused with 422, one whose module is off answers 404; saving is audited. */
  private async saveNotificationPreferences(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const offered = this.offeredKinds(m).map((k) => k.key);
    const b = route.request().postDataJSON() as {
      kinds?: { key: string; inApp: boolean }[];
    };
    const choices = b.kinds ?? [];
    // A kind the role receives whose module is off answers 404 (L2-121).
    if (
      choices.some(
        (c) =>
          !offered.includes(c.key) &&
          NOTIFICATION_KINDS.some((k) => k.key === c.key && k.receives(m)),
      )
    )
      return route.fulfill({ status: 404 });
    if (choices.some((c) => !offered.includes(c.key)))
      return route.fulfill({
        status: 422,
        json: {
          errors: { kinds: "Choose only the notifications offered to you." },
        },
      });
    for (const c of choices)
      this.notificationPreferences.set(`${m.id}:${c.key}`, c.inApp);
    const off = offered.filter(
      (k) => this.notificationPreferences.get(`${m.id}:${k}`) === false,
    );
    this.auditEntries.push({
      organizationId: m.organizationId,
      when: NOW.toISOString(),
      who: m.personName,
      action: "Updated",
      record: "NotificationPreferences",
      summary: off.length
        ? `${m.personName} turned off ${off.join(", ")}`
        : `${m.personName} gets every notification`,
      device: null,
    });
    return route.fulfill({ status: 204 });
  }

  /** A notice someone already has, as a producer would have added it. */
  seedNotification(row: {
    membershipId: string;
    kind: string;
    text: string;
    link: string;
    readAt?: string | null;
  }): void {
    const m = memberships.find((x) => x.id === row.membershipId)!;
    this.notifications.push({
      id: `n-${this.nextId++}`,
      organizationId: m.organizationId,
      createdAt: new Date(
        NOW.getTime() - 3_600_000 + this.nextId * 1000,
      ).toISOString(),
      readAt: null,
      ...row,
    });
  }

  private visibleNotifications(m: Membership) {
    const on = this.modules.get(m.organizationId)!;
    return this.notifications
      .filter(
        (n) => n.membershipId === m.id && n.organizationId === m.organizationId,
      )
      .filter((n) =>
        (NOTIFICATION_MODULES[n.kind] ?? []).every((x) => on.includes(x)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private async listNotifications(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const mine = this.visibleNotifications(m);
    return route.fulfill({
      json: {
        unread: mine.filter((n) => !n.readAt).length,
        items: mine.map(({ id, kind, text, link, createdAt, readAt }) => ({
          id,
          kind,
          text,
          link,
          createdAt,
          readAt,
        })),
      },
    });
  }

  private async readNotification(route: Route, id: string): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const n = this.notifications.find(
      (x) => x.id === id && x.membershipId === m.id,
    );
    if (!n) return route.fulfill({ status: 404 });
    if (!n.readAt) {
      n.readAt = NOW.toISOString();
      this.publish([m.id], "notification", {});
    }
    return route.fulfill({ status: 204 });
  }

  private async readAllNotifications(route: Route): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    const unread = this.visibleNotifications(m).filter((n) => !n.readAt);
    for (const n of unread) n.readAt = NOW.toISOString();
    if (unread.length) this.publish([m.id], "notification", {});
    return route.fulfill({ status: 204 });
  }

  private async reportsCaller(route: Route): Promise<Membership | null> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      await this.unauthenticated(route);
      return null;
    }
    if (!this.modules.get(m.organizationId)!.includes("Reports")) {
      await route.fulfill({ status: 404 });
      return null;
    }
    if (!can.viewReports(m)) {
      await this.forbidden(route);
      return null;
    }
    return m;
  }

  /** Mirrors backend ReportCalculator. */
  private computeReport(
    m: Membership,
    programId: string | null,
    mask: boolean,
  ) {
    const programs = this.programs.filter(
      (p) =>
        p.organizationId === m.organizationId &&
        (!programId || p.id === programId),
    );
    const childIds = new Set(programs.flatMap((p) => p.roster));
    const own = this.households.filter(
      (h) => h.organizationId === m.organizationId,
    );
    const children = own
      .flatMap((h) => h.children.map((c) => ({ c, h })))
      .filter(({ c }) => childIds.has(c.id));
    const sessions = this.events.filter(
      (e) =>
        programs.some((p) => p.id === e.programId) &&
        e.status !== "Cancelled" &&
        e.startsAt <= NOW.toISOString(),
    );
    const rate = (events: FakeEvent[]): number | null => {
      const recs = events.flatMap((e) => [
        ...this.sessionRecords(e.id).values(),
      ]);
      const present = recs.filter(
        (r) => r.status === "Present" || r.status === "SignedOut",
      ).length;
      const absent = recs.filter((r) => r.status === "Absent").length;
      return present + absent
        ? Math.round((100 * present) / (present + absent))
        : null;
    };
    const count = (n: number) => (mask && n > 0 && n < 5 ? "<5" : String(n));
    const bands: [string, number, number][] = [
      ["Under 6", 0, 5],
      ["6–8", 6, 8],
      ["9–11", 9, 11],
      ["12–13", 12, 13],
      ["14 and over", 14, 200],
    ];
    const languages = new Map<string, number>();
    for (const h of own.filter((x) =>
      children.some(({ h: ch }) => ch.id === x.id),
    ))
      languages.set(h.language, (languages.get(h.language) ?? 0) + 1);
    return {
      childrenServed: children.length,
      attendanceRate: rate(sessions) ?? 0,
      sessionsDelivered: sessions.length,
      slipsSigned: 0,
      ages: bands.map(([band, min, max]) => ({
        band,
        count: count(
          children.filter(
            ({ c }) =>
              (ageOf(c.dateOfBirth) ?? -1) >= min &&
              (ageOf(c.dateOfBirth) ?? -1) <= max,
          ).length,
        ),
      })),
      programs: programs
        .filter((p) => p.status === "Active")
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({
          id: p.id,
          name: p.name,
          attendanceRate: rate(sessions.filter((e) => e.programId === p.id)),
        })),
      languages: [...languages.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([language, households]) => ({ language, households })),
      masked: mask,
      surveyResponses: [...this.surveyAnswers.keys()].filter(
        (t) => this.surveyLinks.get(t)?.organizationId === m.organizationId,
      ).length,
      surveyAverage: (() => {
        const r = [...this.surveyAnswers.entries()]
          .filter(
            ([t]) =>
              this.surveyLinks.get(t)?.organizationId === m.organizationId,
          )
          .map(([, a]) => a.rating);
        return r.length
          ? Math.round((r.reduce((a, b) => a + b, 0) / r.length) * 10) / 10
          : null;
      })(),
    };
  }

  private readonly reports = new FakeReports();
  /** Children who left a program: ended enrollments, kept for retention (L2-127). */
  private readonly endedEnrollments = new Map<string, string[]>();

  /** Ends a child's enrollment, as removing them from the roster would; the report counts it against retention. */
  endEnrollment(programId: string, childId: string): void {
    const program = this.programs.find((p) => p.id === programId)!;
    program.roster = program.roster.filter((id) => id !== childId);
    this.endedEnrollments.set(programId, [
      ...(this.endedEnrollments.get(programId) ?? []),
      childId,
    ]);
  }

  /** What the detailed reports read, for the caller's organization (mirrors the tenant filter). */
  private reportSource(m: Membership): ReportSource {
    const org = m.organizationId;
    const children = new Map<
      string,
      { name: string; dateOfBirth: string | null }
    >();
    for (const h of this.households.filter((x) => x.organizationId === org))
      for (const c of h.children)
        children.set(c.id, {
          name: `${c.firstName} ${c.lastName}`,
          dateOfBirth: c.dateOfBirth,
        });
    return {
      organizationId: org,
      modules: this.modules.get(org)!,
      programs: this.programs.filter((p) => p.organizationId === org),
      events: this.events.filter((e) => e.organizationId === org),
      records: (eventId) => this.sessionRecords(eventId),
      children,
      ended: (programId) => this.endedEnrollments.get(programId) ?? [],
      youthAccount: (childId) =>
        [...this.youthLinks].find(
          ([mid, cid]) =>
            cid === childId &&
            memberships.some((x) => x.id === mid && x.organizationId === org),
        )?.[0] ?? null,
      flags: this.atRiskFlags.rows,
      checkIns: this.mentorCheckIns.rows,
      learning: this.learningState,
      curriculum: this.curriculumState,
      badges: (membershipId) =>
        this.badges.awards
          .filter((a) => a.membershipId === membershipId)
          .sort((a, b) => a.awardedAt.localeCompare(b.awardedAt))
          .map((a) => this.badges.badges.find((b) => b.id === a.badgeId)?.name ?? a.badgeId),
      mentorName: (childId) => {
        const id = this.youthMentors.get(childId);
        return memberships.find((x) => x.id === id)?.personName ?? null;
      },
      mentors: this.activeMentors(org),
      youthMentors: new Map(
        [...this.youthMentors].filter(([, mentor]) =>
          memberships.some((x) => x.id === mentor && x.organizationId === org),
        ),
      ),
      teams: new Map(
        [...this.cohortMentors].map(([programId, team]) => [
          programId,
          { lead: team.lead ?? null, supporting: team.supporting ?? [] },
        ]),
      ),
      reviews: this.learningState.work
        .all()
        .flatMap((w) => w.history)
        .filter((e) => e.kind === "Accepted" || e.kind === "RevisionRequested")
        .map((e) => ({ actor: e.actor, at: e.at })),
      today: TODAY,
    };
  }

  private async progressBoard(route: Route, id: string): Promise<void> {
    const m = await this.reportsCaller(route);
    if (!m) return;
    if (!this.modules.get(m.organizationId)!.includes("Learning"))
      return route.fulfill({ status: 404 });
    const board = this.reports.progress(this.reportSource(m), id);
    return board ? route.fulfill({ json: board }) : route.fulfill({ status: 404 });
  }

  private async staffReport(route: Route): Promise<void> {
    const m = await this.reportsCaller(route);
    if (!m) return;
    if (!this.modules.get(m.organizationId)!.includes("Mentoring"))
      return route.fulfill({ status: 404 });
    const raw = new URL(route.request().url()).searchParams.get("days");
    const days = raw === null ? null : Number(raw);
    if (days !== null && days !== 30 && days !== 90)
      return route.fulfill({
        status: 422,
        json: { errors: { days: "Choose 30 or 90 days, or all time." } },
      });
    return route.fulfill({ json: this.reports.staff(this.reportSource(m), days) });
  }

  private async youthReport(route: Route, id: string): Promise<void> {
    const m = await this.reportsCaller(route);
    if (!m) return;
    const report = this.reports.youth(this.reportSource(m), id);
    return report ? route.fulfill({ json: report }) : route.fulfill({ status: 404 });
  }

  private async cohortReport(route: Route, id: string): Promise<void> {
    const m = await this.reportsCaller(route);
    if (!m) return;
    const report = this.reports.cohort(this.reportSource(m), id);
    return report
      ? route.fulfill({ json: report })
      : route.fulfill({ status: 404 });
  }

  private async report(route: Route): Promise<void> {
    const m = await this.reportsCaller(route);
    if (!m) return;
    const programId = new URL(route.request().url()).searchParams.get(
      "programId",
    );
    return route.fulfill({
      json: this.computeReport(m, programId, !can.readSmallCounts(m)),
    });
  }

  /** The CSV of the latest export, as the download would answer it. */
  lastExportCsv(): string {
    return [...this.reportExports.values()].at(-1)?.csv ?? "";
  }

  private async exportReport(route: Route): Promise<void> {
    const m = await this.reportsCaller(route);
    if (!m) return;
    const b = route.request().postDataJSON() as {
      programId: string | null;
      kind?: string | null;
      days?: number | null;
    };
    const kind = b.kind ?? "Summary";
    if (kind !== "Summary") return this.exportDetailed(route, m, kind, b);
    const r = this.computeReport(m, b.programId, true);
    const csv = [
      "Measure,Value",
      `Children served,${r.childrenServed}`,
      "",
      "Age,Children",
      ...r.ages.map((a) => `${a.band},${a.count}`),
    ].join("\n");
    const id = `export-${this.nextId++}`;
    const org = organizations.find((o) => o.id === m.organizationId)!;
    const fileName = `${org.name.toLowerCase().split(" ").join("-")}-report-2026-11-05.csv`;
    this.reportExports.set(id, {
      organizationId: m.organizationId,
      fileName,
      csv,
    });
    return route.fulfill({
      status: 201,
      json: {
        id,
        fileName,
        rows: r.ages.length + r.programs.length + r.languages.length + 4,
        expiresAt: "2026-11-12T21:12:00Z",
      },
    });
  }

  /** Mirrors backend ReportsHandler.ExportAsync for the detailed kinds (L2-129). */
  private async exportDetailed(
    route: Route,
    m: Membership,
    kind: string,
    b: { programId: string | null; days?: number | null },
  ): Promise<void> {
    if (kind !== "Cohort" && kind !== "Progress" && kind !== "Staff")
      return route.fulfill({
        status: 422,
        json: { errors: { kind: "Choose Summary, Cohort, Progress or Staff." } },
      });
    if (kind !== "Staff" && !b.programId)
      return route.fulfill({
        status: 422,
        json: { errors: { programId: "Choose a cohort." } },
      });
    const on = this.modules.get(m.organizationId)!;
    if ((kind === "Progress" && !on.includes("Learning")) || (kind === "Staff" && !on.includes("Mentoring")))
      return route.fulfill({ status: 404 });
    const days = b.days ?? null;
    if (kind === "Staff" && days !== null && days !== 30 && days !== 90)
      return route.fulfill({
        status: 422,
        json: { errors: { days: "Choose 30 or 90 days, or all time." } },
      });
    const out = this.reports.csv(this.reportSource(m), kind, b.programId, days);
    if (!out) return route.fulfill({ status: 404 });
    const slug = (name: string) =>
      name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
        .split(" ")
        .join("-");
    const org = organizations.find((o) => o.id === m.organizationId)!;
    const fileName = [slug(org.name), kind.toLowerCase(), out.programName ? slug(out.programName) : null, "2026-11-05"]
      .filter(Boolean)
      .join("-") + ".csv";
    const id = `export-${this.nextId++}`;
    this.reportExports.set(id, {
      organizationId: m.organizationId,
      fileName,
      csv: out.lines.join("\n") + "\n",
    });
    return route.fulfill({
      status: 201,
      json: { id, fileName, rows: out.lines.length - 1, expiresAt: "2026-11-12T21:12:00Z" },
    });
  }

  /** Closes a survey link, as a week after sending. */
  closeSurvey(token: string): void {
    this.surveyLinks.get(token)!.closed = true;
  }

  private async sendSurvey(route: Route, eventId: string): Promise<void> {
    const m = await this.reportsCaller(route);
    if (!m) return;
    const e = this.events.find(
      (x) => x.id === eventId && x.organizationId === m.organizationId,
    );
    if (!e) return route.fulfill({ status: 404 });
    const program = this.programs.find((p) => p.id === e.programId)!;
    const households = new Set(
      this.households
        .filter((h) => h.children.some((c) => program.roster.includes(c.id)))
        .map((h) => h.id),
    );
    return route.fulfill({
      status: 201,
      json: {
        id: `survey-${this.nextId++}`,
        households: households.size,
        closesAt: "2026-11-12T21:12:00Z",
      },
    });
  }

  private surveyScope(token: string) {
    const link = this.surveyLinks.get(token);
    const household = link
      ? this.households.find((h) => h.id === link.householdId)
      : undefined;
    const org = link
      ? organizations.find((o) => o.id === link.organizationId)
      : undefined;
    return link && household && org ? { link, household, org } : null;
  }

  /** Mirrors backend GuardianSurveyHandler. */
  private async guardianSurvey(route: Route, token: string): Promise<void> {
    const s = this.surveyScope(token);
    if (!s)
      return route.fulfill({
        status: 410,
        json: { code: "link-expired", organization: null, phone: null },
      });
    if (!this.modules.get(s.org.id)!.includes("Reports"))
      return route.fulfill({ status: 404 });
    if (!this.trustedHouseholds.has(s.household.id)) {
      const contacts = s.household.guardians
        .filter((g) => g.mobile)
        .map((g) => `•••-•••-${g.mobile!.slice(-4)}`);
      return route.fulfill({
        status: 401,
        json: {
          code: "verification-required",
          language: this.guardianLanguage(s.household.language),
          organization: s.org.name,
          phone: "905-555-0100",
          contacts,
        },
      });
    }
    const child = s.household.children.find((c) => c.id === s.link.childId)!;
    const event = this.events.find((e) => e.id === s.link.eventId)!;
    const primary = this.sortedGuardians(s.household)[0];
    return route.fulfill({
      json: {
        language: this.guardianLanguage(s.household.language),
        organization: s.org.name,
        organizationPhone: "905-555-0100",
        guardianFirstName: primary?.name.split(" ")[0] ?? "",
        eventName: event.name,
        childFirstName: child.firstName,
        sentBy: "Marisol Delgado",
        status: this.surveyAnswers.has(token)
          ? "Answered"
          : s.link.closed
            ? "Closed"
            : "Open",
      },
    });
  }

  private async answerSurvey(route: Route, token: string): Promise<void> {
    const s = this.surveyScope(token);
    if (!s)
      return route.fulfill({ status: 410, json: { code: "link-expired" } });
    if (!this.modules.get(s.org.id)!.includes("Reports"))
      return route.fulfill({ status: 404 });
    if (!this.trustedHouseholds.has(s.household.id))
      return route.fulfill({
        status: 401,
        json: { code: "verification-required" },
      });
    if (this.surveyAnswers.has(token) || s.link.closed)
      return route.fulfill({ status: 409 });
    const b = route.request().postDataJSON() as {
      rating: number | null;
      comment: string | null;
    };
    if (!(b.rating && b.rating >= 1 && b.rating <= 5))
      return route.fulfill({
        status: 422,
        json: { errors: { rating: "Pick a number from 1 to 5." } },
      });
    this.surveyAnswers.set(token, {
      rating: b.rating,
      comment: b.comment?.trim() || null,
    });
    return route.fulfill({ status: 204 });
  }

  private async downloadExport(route: Route, id: string): Promise<void> {
    const m = await this.reportsCaller(route);
    if (!m) return;
    const e = this.reportExports.get(id);
    if (!e || e.organizationId !== m.organizationId)
      return route.fulfill({ status: 404 });
    return route.fulfill({
      status: 200,
      contentType: "text/csv",
      headers: {
        "content-disposition": `attachment; filename="${e.fileName}"`,
      },
      body: e.csv,
    });
  }

  private async listSlips(route: Route): Promise<void> {
    const m = await this.slipsCaller(route);
    if (!m) return;
    const slips = this.events
      .filter((e) => e.organizationId === m.organizationId && e.requiresSlip)
      .map((e) => ({ e, slip: this.slipOf(e.id)! }))
      .sort((a, z) => a.slip.signBy.localeCompare(z.slip.signBy))
      .map(({ e, slip }) => {
        const responses = this.slipResponses(m, slip, e);
        const program = this.programs.find((p) => p.id === e.programId)!;
        return {
          id: slip.id,
          eventId: e.id,
          title: slip.title || e.name,
          programName: program.name,
          signBy: slip.signBy,
          status: slip.status,
          children: responses.length,
          signed: responses.filter((r) => r.status === "Signed").length,
          declined: responses.filter((r) => r.status === "Declined").length,
        };
      });
    return route.fulfill({ json: { slips } });
  }

  private async quickCard(route: Route, id: string): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    if (!this.modules.get(m.organizationId)!.includes("QuickCards"))
      return route.fulfill({ status: 404 });
    const found = this.ownChild(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const { child, household } = found;
    const allowed = can.readMedical(m);
    const med = child.medical;
    const hasMedical = !!(
      med.allergies ||
      med.medication ||
      med.conditions ||
      med.doctor ||
      med.healthCard
    );
    const guardians = [...household.guardians].sort(
      (a, b) =>
        Number(b.isPrimary) - Number(a.isPrimary) ||
        a.name.localeCompare(b.name),
    );
    return route.fulfill({
      json: {
        id: child.id,
        householdId: household.id,
        name: `${child.firstName} ${child.lastName}`,
        age: ageOf(child.dateOfBirth),
        school: child.school,
        programs: this.programs
          .filter(
            (p) =>
              p.organizationId === m.organizationId &&
              p.roster.includes(child.id),
          )
          .map((p) => p.name)
          .sort(),
        primaryGuardian: guardians[0]?.name ?? null,
        language: household.language,
        allergyAlert:
          allowed && med.redAlert && med.allergies
            ? {
                title: `Severe allergy: ${med.allergies}`,
                instruction: med.alertInstruction ?? null,
              }
            : null,
        medical:
          allowed && hasMedical
            ? {
                allergies: med.allergies,
                medication: med.medication,
                conditions: med.conditions,
                doctor: med.doctor,
                healthCard: med.healthCard ?? null,
              }
            : null,
        callOrder: guardians
          .filter((g) => g.mobile)
          .map((g) => ({
            name: g.name,
            relationship: g.relationship,
            phone: g.mobile,
            language: g.language,
            isPrimary: g.isPrimary,
          })),
        approvedPickups: [
          ...guardians
            .filter((g) => g.canPickUp)
            .map((g) => ({
              name: g.name,
              relationship: g.relationship,
              isPrimary: g.isPrimary,
              pickupId: null,
            })),
          ...this.activePickups(child.id).map((x) => ({
            name: x.name,
            relationship: x.relationship,
            isPrimary: false,
            pickupId: x.id,
          })),
        ],
        notes: child.notes ?? null,
        medicalRestricted: !allowed,
      },
    });
  }

  private startSession(membershipId: string): void {
    this.membershipId = membershipId;
    this.expired = false;
  }

  private async reject(route: Route): Promise<void> {
    this.unrouted.push(`${route.request().method()} ${route.request().url()}`);
    await route.fulfill({
      status: 599,
      body: "Unrouted request in the fake API",
    });
  }
}
