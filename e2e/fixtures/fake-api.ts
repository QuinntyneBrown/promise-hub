import type { Page, Route } from '@playwright/test';
import { type FakeGuardian, type FakeHousehold, ageOf, hasMedicalFlag, medicalFlag, reachable, seedHouseholds } from './households';
import { type FakeEvent, type FakeProgram, NOW, seedEvents, seedPrograms } from './programs';
import { type Membership, type ModuleId, moduleCatalog, memberships, organizations, seededMfaCode, seededPassword } from './seed';

/** Mirrors backend RolePermissions. */
const can = {
  writeHouseholds: (m: Membership) => ['Admin', 'ProgramDirector'].includes(m.role),
  deleteHouseholds: (m: Membership) => m.role === 'Admin',
  readMedical: (m: Membership) => ['Admin', 'ProgramDirector', 'SiteLead'].includes(m.role),
  writeMedical: (m: Membership) => ['Admin', 'ProgramDirector'].includes(m.role),
  managePrograms: (m: Membership) => ['Admin', 'ProgramDirector'].includes(m.role),
  manageEvents: (m: Membership) => ['Admin', 'ProgramDirector', 'SiteLead'].includes(m.role),
  cancelEvents: (m: Membership) => ['Admin', 'ProgramDirector'].includes(m.role),
  runSessions: (m: Membership) => ['Admin', 'ProgramDirector', 'SiteLead', 'YouthWorker'].includes(m.role),
  runAnySession: (m: Membership) => ['Admin', 'ProgramDirector', 'SiteLead'].includes(m.role),
  sendMessages: (m: Membership) => ['Admin', 'ProgramDirector', 'SiteLead'].includes(m.role),
  manageSlips: (m: Membership) => ['Admin', 'ProgramDirector', 'SiteLead'].includes(m.role),
};

type ImportField = 'ChildName' | 'DateOfBirth' | 'School' | 'GuardianName' | 'GuardianPhone' | 'GuardianEmail' | 'Allergies' | 'Language' | 'Notes' | 'Skip';

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
  ['ChildName', ['child', 'child name', 'student', 'student name', 'kid', 'name', 'participant']],
  ['DateOfBirth', ['dob', 'date of birth', 'birthday', 'birth date', 'birthdate']],
  ['School', ['school', 'grade', 'school and grade']],
  ['GuardianName', ['parent', 'guardian', 'parent name', 'guardian name', 'parent/guardian', 'mother', 'father', 'contact name']],
  ['GuardianPhone', ['cell', 'phone', 'mobile', 'parent phone', 'guardian phone', 'cell phone', 'phone number']],
  ['GuardianEmail', ['email', 'e-mail', 'parent email', 'guardian email']],
  ['Allergies', ['allergies', 'allergy', 'medical', 'allergies/meds', 'allergies and medication']],
  ['Language', ['lang', 'language', 'home language']],
  ['Notes', ['notes', 'note', 'comments']],
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
  household: { guardianName: string | null; mobile: string | null; email: string | null; language: string | null };
  children: FakeEnrollChild[];
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
  reminders: 'TwiceWeekly' | 'Daily' | 'Once' | 'None';
  channel: 'TextAndEmail' | 'EmailOnly';
  status: 'Draft' | 'Scheduled' | 'Sent';
  scheduledFor: string | null;
  sentAt: string | null;
  version: number;
  answers: Map<string, { status: 'Signed' | 'Declined'; by: string; version: number }>;
  messageId: string | null;
}

type ChannelChoice = 'TextWithEmailFallback' | 'EmailOnly' | 'TextOnly';

interface FakeDelivery {
  household: string;
  guardian: string | null;
  channel: 'Sms' | 'Email';
  language: string;
  status: 'Queued' | 'Sent' | 'FellBackToEmail' | 'Paused' | 'Failed';
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

const GSM7 = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

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
  status: 'NotYet' | 'Present' | 'Absent' | 'SignedOut';
  checkedInAt: string | null;
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

const MFA_ROLES = new Set(['Admin', 'ProgramDirector']);

/**
 * Answers the real API's contracts from seeded in-memory data. The session is the
 * membership signed in; the tenant always comes from it, never from the request.
 * Any request the fake does not route is recorded and fails the test.
 */
export class FakeApi {
  readonly unrouted: string[] = [];
  private failures = new Map<string, number>();
  private signInFailures = new Map<string, number>();
  private mfaPending: string | null = null;
  private expired = false;
  // Per-organization module state, copied so tests never share changes.
  private modules = new Map(organizations.map((o) => [o.id, [...o.modules]]));
  private households: FakeHousehold[] = seedHouseholds();
  private programs: FakeProgram[] = seedPrograms();
  private events: FakeEvent[] = seedEvents();
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
    status: 'WaitingReview' | 'Waitlisted' | 'Accepted' | 'Declined';
    position: number | null;
    childId?: string;
    submittedAt?: string;
    note?: string | null;
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
    status: 'NeedsReview' | 'Open' | 'Closed';
    reportedAt: string;
    review?: { note: string; outcome: string; by: string; at: string } | null;
    followUps?: { text: string; by: string; at: string }[];
    trail?: { text: string; at: string }[];
  }[] = [];
  /** No-show texts the job sent, and the guardian's reply: "event:child" → state and time. */
  private noShows = new Map<string, { state: 'TextSent' | 'OnTheWay' | 'Absent'; at: string }>();
  /** Household home links as texted with an enrollment decision: token → household. */
  private homeLinks = new Map<string, string>([
    ['tok-home-tran', 'hh-tran'],
    ['tok-home-rivera', 'hh-rivera'],
  ]);
  /** The verified enrollment session of this browser: program, contact and draft (the HttpOnly cookie, in the fake). */
  private enrollSession: { programId: string; contact: string; householdId: string | null; draft: FakeEnrollDraft | null; submitted: boolean } | null = null;
  /** Guardian links as texted with a sent slip: token → household, child and event. */
  private guardianLinks = new Map<string, { householdId: string; childId: string; eventId: string; expired?: boolean }>([
    ['tok-mateo', { householdId: 'hh-rivera', childId: 'c-mateo', eventId: 'e-rbg' }],
    ['tok-sofia', { householdId: 'hh-rivera', childId: 'c-sofia', eventId: 'e-rbg' }],
    ['tok-jordan', { householdId: 'hh-thompson', childId: 'c-jordan', eventId: 'e-rbg' }],
    ['tok-expired', { householdId: 'hh-rivera', childId: 'c-mateo', eventId: 'e-rbg', expired: true }],
  ]);
  /** Households whose device has verified a code (the HttpOnly cookie, in the fake). */
  private trustedHouseholds = new Set<string>();
  private wrongCodes = new Map<string, number>();
  private lockedLinks = new Set<string>();
  /** The six-digit code the fake texts to a contact on file. */
  readonly guardianCode = '482913';
  private smsUsed = new Map<string, number>();
  /** Who works each session; youth workers run only these (as seeded: Jaylen and Aisha tonight). */
  private sessionStaff = new Map<string, string[]>([['e-tutoring-today', ['m-jaylen', 'm-aisha']]]);
  private nextId = 1;

  constructor(private membershipId: string | null) {}

  /** Makes the next calls to a route answer with the given status, as the real API would on a fault. */
  failNext(path: string, status: number): void {
    this.failures.set(path, status);
  }

  /** Opens a program's enrollment, as a director would; the link is /g/enroll/<program-name>. */
  openEnrollment(programId: string): string {
    const program = this.programs.find((x) => x.id === programId)!;
    const slug = program.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    this.enrollmentSlugs.set(programId, slug);
    program.enrollmentOpen = true;
    return slug;
  }

  /** A child of a seeded household who asked to enroll in a program, waiting for review. */
  requestEnrollment(programId: string, childId: string, submittedAt = '2026-11-02T15:00:00Z'): void {
    this.enrollmentRequests.push({ id: `er-${this.nextId++}`, programId, status: 'WaitingReview', position: null, childId, submittedAt });
  }

  /** A child's enrollment as staff decided it, with the note the guardian reads; an accepted child is on the roster. */
  decideEnrollment(programId: string, childId: string, status: 'Accepted' | 'Waitlisted' | 'Declined', note: string | null = null): void {
    const position = status === 'Waitlisted' ? this.enrollmentRequests.filter((r) => r.programId === programId && r.status === 'Waitlisted').length + 1 : null;
    this.enrollmentRequests.push({ id: `er-${this.nextId++}`, programId, status, position, childId, submittedAt: '2026-11-02T15:00:00Z', note });
    if (status === 'Accepted') this.programs.find((x) => x.id === programId)!.roster.push(childId);
  }

  /** The no-show job texted this child's household; a reply of 2 also marks the child absent, as the API does. */
  noShowAlert(eventId: string, childId: string, state: 'TextSent' | 'OnTheWay' | 'Absent' = 'TextSent', at = '2026-10-21T20:15:00Z'): void {
    this.noShows.set(`${eventId}:${childId}`, { state, at });
    if (state === 'Absent') this.sessionRecords(eventId).set(childId, { status: 'Absent', checkedInAt: null });
  }

  /** An incident someone already reported (seeded as the API would store it). */
  reportIncident(reporterId: string, category: string, childId: string): string {
    const m = memberships.find((x) => x.id === reporterId)!;
    const id = `inc-${this.nextId++}`;
    this.incidents.push({ id, organizationId: m.organizationId, reporterId, reportedBy: m.personName, category, childId, occurredAt: '2026-10-21T18:40:00Z', place: 'Gym', whatHappened: 'Fell during the relay.', actionTaken: 'Ice pack.', guardianContact: 'LeftMessage', severity: 'Minor', status: 'NeedsReview', reportedAt: NOW.toISOString() });
    return id;
  }

  /** Takes a household's children off every roster, as if they never enrolled. */
  unenrollHousehold(householdId: string): void {
    const ids = this.households.find((h) => h.id === householdId)!.children.map((c) => c.id);
    for (const p of this.programs) p.roster = p.roster.filter((id) => !ids.includes(id));
  }

  /** Closes a program's enrollment; its link stays the same. */
  closeEnrollment(programId: string): void {
    this.programs.find((x) => x.id === programId)!.enrollmentOpen = false;
  }

  /** Fills a program to capacity with accepted enrollments. */
  fillProgram(programId: string): void {
    const program = this.programs.find((x) => x.id === programId)!;
    program.capacity = program.roster.length;
  }

  /** Takes away every way to reach a household: no mobile, and its email bounced. */
  makeUnreachable(householdId: string): void {
    for (const g of this.households.find((h) => h.id === householdId)!.guardians) {
      g.mobile = null;
      g.emailBounced = true;
    }
  }

  /** Trusts this browser for a household, as a verified code would. */
  trustGuardianDevice(householdId: string): void {
    this.trustedHouseholds.add(householdId);
  }

  /** A guardian's answer for one child, as the guardian slip page will record it. */
  answerSlip(eventId: string, childId: string, status: 'Signed' | 'Declined', by = 'Carmen Rivera'): void {
    const slip = this.slipOf(eventId)!;
    slip.answers.set(childId, { status, by, version: slip.version });
  }

  /** Writes and sends an event's slip, as a director would. */
  sendSlip(eventId: string, body = 'We’re taking the After-School Tutoring group to the Royal Botanical Gardens.'): void {
    const slip = this.slipOf(eventId)!;
    Object.assign(slip, { body, signBy: '2026-11-12', status: 'Sent', sentAt: NOW.toISOString() });
    this.events.find((e) => e.id === eventId)!.slipStatus = 'Sent';
  }

  /** Sets the SMS segments an organization has used this month (the cap is 2,000 on Standard, 200 on Free). */
  setSmsUsed(organizationId: string, used: number): void {
    this.smsUsed.set(organizationId, used);
  }

  /** Adds a session tonight in After-School Tutoring with no staff assigned, as a director would. */
  addSessionTonight(name: string): void {
    const base = this.events.find((e) => e.id === 'e-tutoring-today')!;
    this.events.push({ ...base, id: `e-${this.nextId++}`, name, startsAt: '2026-11-05T23:00:00Z', endsAt: '2026-11-06T00:00:00Z', place: 'Room 3' });
  }

  /** Sets the modules on for an organization, as Settings › Modules would. */
  setModules(organizationId: string, on: ModuleId[]): void {
    this.modules.set(organizationId, on);
  }

  /** Removes every household of an organization, for empty states. */
  clearHouseholds(organizationId: string): void {
    this.households = this.households.filter((h) => h.organizationId !== organizationId);
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
    ['GET', /^\/api\/me$/, (route) => this.me(route)],
    ['POST', /^\/api\/auth\/sign-in$/, (route) => this.signIn(route)],
    ['POST', /^\/api\/auth\/mfa$/, (route) => this.mfa(route)],
    ['POST', /^\/api\/auth\/sign-out$/, (route) => this.signOut(route)],
    ['GET', /^\/api\/settings\/modules$/, (route) => this.getModules(route)],
    ['PUT', /^\/api\/settings\/modules$/, (route) => this.saveModules(route)],
    ['GET', /^\/api\/households$/, (route) => this.listHouseholds(route)],
    ['POST', /^\/api\/households$/, (route) => this.createHousehold(route)],
    ['GET', /^\/api\/households\/(?<id>[^/]+)$/, (route, p) => this.getHousehold(route, p['id']!)],
    ['DELETE', /^\/api\/households\/(?<id>[^/]+)$/, (route, p) => this.deleteHousehold(route, p['id']!)],
    ['POST', /^\/api\/households\/(?<id>[^/]+)\/children$/, (route, p) => this.addChild(route, p['id']!)],
    ['POST', /^\/api\/households\/(?<id>[^/]+)\/guardians$/, (route, p) => this.addGuardian(route, p['id']!)],
    ['PUT', /^\/api\/guardians\/(?<id>[^/]+)$/, (route, p) => this.updateGuardian(route, p['id']!)],
    ['GET', /^\/api\/children$/, (route) => this.findChildren(route)],
    ['GET', /^\/api\/programs$/, (route) => this.listPrograms(route)],
    ['POST', /^\/api\/programs$/, (route) => this.saveProgram(route, null)],
    ['GET', /^\/api\/programs\/(?<id>[^/]+)$/, (route, p) => this.getProgram(route, p['id']!)],
    ['PUT', /^\/api\/programs\/(?<id>[^/]+)$/, (route, p) => this.saveProgram(route, p['id']!)],
    ['POST', /^\/api\/programs\/(?<id>[^/]+)\/archive$/, (route, p) => this.archiveProgram(route, p['id']!)],
    ['POST', /^\/api\/programs\/(?<id>[^/]+)\/restore$/, (route, p) => this.restoreProgram(route, p['id']!)],
    ['POST', /^\/api\/programs\/(?<id>[^/]+)\/enrollments$/, (route, p) => this.enroll(route, p['id']!)],
    ['DELETE', /^\/api\/programs\/(?<id>[^/]+)\/enrollments\/(?<child>[^/]+)$/, (route, p) => this.unenroll(route, p['id']!, p['child']!)],
    ['GET', /^\/api\/events$/, (route) => this.listEvents(route)],
    ['POST', /^\/api\/events$/, (route) => this.saveEvent(route, null)],
    ['GET', /^\/api\/events\/(?<id>[^/]+)$/, (route, p) => this.getEvent(route, p['id']!)],
    ['PUT', /^\/api\/events\/(?<id>[^/]+)$/, (route, p) => this.saveEvent(route, p['id']!)],
    ['POST', /^\/api\/events\/(?<id>[^/]+)\/cancel$/, (route, p) => this.cancelEvent(route, p['id']!)],
    ['GET', /^\/api\/sessions\/today$/, (route) => this.todaySessions(route)],
    ['GET', /^\/api\/sessions\/(?<id>[^/]+)\/roster$/, (route, p) => this.sessionRoster(route, p['id']!)],
    ['POST', /^\/api\/sessions\/(?<id>[^/]+)\/check-ins$/, (route, p) => this.attend(route, p['id']!, 'Present')],
    ['POST', /^\/api\/sessions\/(?<id>[^/]+)\/absences$/, (route, p) => this.attend(route, p['id']!, 'Absent')],
    ['POST', /^\/api\/sessions\/(?<id>[^/]+)\/walk-ins$/, (route, p) => this.addWalkIn(route, p['id']!)],
    ['POST', /^\/api\/sessions\/(?<id>[^/]+)\/sign-outs$/, (route, p) => this.signChildOut(route, p['id']!)],
    ['GET', /^\/api\/children\/(?<id>[^/]+)\/pickups$/, (route, p) => this.pickups(route, p['id']!)],
    ['GET', /^\/api\/programs\/(?<id>[^/]+)\/enrollments$/, (route, p) => this.listEnrollmentRequests(route, p['id']!)],
    ['POST', /^\/api\/enrollments\/review$/, (route) => this.reviewEnrollments(route, null)],
    ['POST', /^\/api\/enrollments\/(?<id>[^/]+)\/review$/, (route, p) => this.reviewEnrollments(route, p['id']!)],
    ['POST', /^\/api\/programs\/(?<id>[^/]+)\/enrollment\/open$/, (route, p) => this.openEnrollmentRoute(route, p['id']!)],
    ['POST', /^\/api\/programs\/(?<id>[^/]+)\/enrollment\/close$/, (route, p) => this.closeEnrollmentRoute(route, p['id']!)],
    ['GET', /^\/api\/g\/enroll\/(?<slug>[^/]+)$/, (route, p) => this.enrollPage(route, p['slug']!)],
    ['POST', /^\/api\/g\/enroll\/(?<slug>[^/]+)\/code$/, (route, p) => this.enrollCode(route, p['slug']!)],
    ['POST', /^\/api\/g\/enroll\/(?<slug>[^/]+)\/verify$/, (route, p) => this.enrollVerify(route, p['slug']!)],
    ['GET', /^\/api\/g\/enroll\/(?<slug>[^/]+)\/draft$/, (route, p) => this.enrollDraft(route, p['slug']!)],
    ['PUT', /^\/api\/g\/enroll\/(?<slug>[^/]+)\/draft$/, (route, p) => this.enrollSave(route, p['slug']!)],
    ['POST', /^\/api\/g\/enroll\/(?<slug>[^/]+)\/submit$/, (route, p) => this.enrollSubmit(route, p['slug']!)],
    ['POST', /^\/api\/imports$/, (route) => this.uploadImport(route)],
    ['PUT', /^\/api\/imports\/(?<id>[^/]+)\/mapping$/, (route, p) => this.mapImport(route, p['id']!)],
    ['POST', /^\/api\/imports\/(?<id>[^/]+)\/run$/, (route, p) => this.runImport(route, p['id']!)],
    ['POST', /^\/api\/g\/auth\/code$/, (route) => this.guardianCodeRoute(route)],
    ['POST', /^\/api\/g\/auth\/verify$/, (route) => this.guardianVerify(route)],
    ['GET', /^\/api\/incidents$/, (route) => this.listIncidents(route)],
    ['GET', /^\/api\/incidents\/form$/, (route) => this.incidentForm(route)],
    ['GET', /^\/api\/incidents\/(?<id>[^/]+)$/, (route, p) => this.getIncident(route, p['id']!)],
    ['POST', /^\/api\/incidents$/, (route) => this.createIncident(route)],
    ['POST', /^\/api\/incidents\/(?<id>[^/]+)\/review$/, (route, p) => this.reviewIncident(route, p['id']!)],
    ['POST', /^\/api\/incidents\/(?<id>[^/]+)\/reopen$/, (route, p) => this.reopenIncident(route, p['id']!)],
    ['POST', /^\/api\/incidents\/(?<id>[^/]+)\/notes$/, (route, p) => this.addIncidentNote(route, p['id']!)],
    ['GET', /^\/api\/g\/home\/(?<token>[^/]+)$/, (route, p) => this.guardianHome(route, p['token']!)],
    ['GET', /^\/api\/g\/slips\/(?<token>[^/]+)$/, (route, p) => this.guardianSlip(route, p['token']!)],
    ['POST', /^\/api\/g\/slips\/(?<token>[^/]+)\/sign$/, (route, p) => this.guardianAnswer(route, p['token']!, 'Signed')],
    ['POST', /^\/api\/g\/slips\/(?<token>[^/]+)\/decline$/, (route, p) => this.guardianAnswer(route, p['token']!, 'Declined')],
    ['GET', /^\/api\/sessions\/(?<id>[^/]+)\/clearance$/, (route, p) => this.clearance(route, p['id']!)],
    ['GET', /^\/api\/slips\/(?<id>[^/]+)\/unsigned$/, (route, p) => this.unsignedFamilies(route, p['id']!)],
    ['POST', /^\/api\/slips\/(?<id>[^/]+)\/remind$/, (route, p) => this.remindNow(route, p['id']!)],
    ['POST', /^\/api\/slips\/(?<id>[^/]+)\/sign-on-tablet$/, (route, p) => this.signOnTablet(route, p['id']!)],
    ['GET', /^\/api\/events\/(?<id>[^/]+)\/slip$/, (route, p) => this.getSlip(route, p['id']!)],
    ['PUT', /^\/api\/events\/(?<id>[^/]+)\/slip$/, (route, p) => this.saveSlip(route, p['id']!)],
    ['GET', /^\/api\/slips$/, (route) => this.listSlips(route)],
    ['POST', /^\/api\/slips\/(?<id>[^/]+)\/send$/, (route, p) => this.sendSlipRoute(route, p['id']!)],
    ['POST', /^\/api\/slips\/(?<id>[^/]+)\/send-now$/, (route, p) => this.slipTransition(route, p['id']!, 'send-now')],
    ['POST', /^\/api\/slips\/(?<id>[^/]+)\/cancel-send$/, (route, p) => this.slipTransition(route, p['id']!, 'cancel')],
    ['PUT', /^\/api\/slips\/(?<id>[^/]+)$/, (route, p) => this.editSlip(route, p['id']!)],
    ['GET', /^\/api\/messages$/, (route) => this.listMessages(route)],
    ['POST', /^\/api\/messages\/preview$/, (route) => this.previewMessage(route)],
    ['POST', /^\/api\/messages$/, (route) => this.sendMessage(route)],
    ['GET', /^\/api\/messages\/(?<id>[^/]+)$/, (route, p) => this.getMessage(route, p['id']!)],
    ['GET', /^\/api\/messaging\/sms-cap$/, (route) => this.smsCap(route)],
    ['GET', /^\/api\/children\/(?<id>[^/]+)\/quick-card$/, (route, p) => this.quickCard(route, p['id']!)],
    ['GET', /^\/api\/children\/(?<id>[^/]+)$/, (route, p) => this.getChild(route, p['id']!)],
    ['PUT', /^\/api\/children\/(?<id>[^/]+)$/, (route, p) => this.updateChild(route, p['id']!)],
    ['PUT', /^\/api\/children\/(?<id>[^/]+)\/medical$/, (route, p) => this.updateMedical(route, p['id']!)],
  ];

  private async handle(route: Route): Promise<void> {
    const url = new URL(route.request().url());
    const failure = this.failures.get(url.pathname);
    if (failure) {
      return route.fulfill({ status: failure });
    }
    for (const [method, pattern, handler] of this.routes) {
      const match = pattern.exec(url.pathname);
      if (match && route.request().method() === method) {
        return handler(route, match.groups ?? {});
      }
    }
    return this.reject(route);
  }

  private unauthenticated(route: Route): Promise<void> {
    return route.fulfill({
      status: 401,
      json: { code: this.expired ? 'session-expired' : 'unauthenticated' },
    });
  }

  private async me(route: Route): Promise<void> {
    const membership = memberships.find((m) => m.id === this.membershipId);
    if (!membership) {
      return this.unauthenticated(route);
    }
    const organization = organizations.find((o) => o.id === membership.organizationId)!;
    return route.fulfill({
      json: {
        personName: membership.personName,
        role: membership.role,
        organizationId: organization.id,
        organizationName: organization.name,
        plan: organization.plan,
        modules: this.modules.get(organization.id),
      },
    });
  }

  private async signIn(route: Route): Promise<void> {
    const { email, password } = route.request().postDataJSON() as { email: string; password: string };
    const key = email.trim().toLowerCase();
    if ((this.signInFailures.get(key) ?? 0) >= 5) {
      return route.fulfill({ status: 423, json: { code: 'locked', lockedUntil: '2026-11-05T21:27:00Z' } });
    }
    const membership = memberships
      .filter((m) => m.email === key)
      .sort((a, b) => a.organizationId.localeCompare(b.organizationId))[0];
    if (!membership || password !== seededPassword) {
      this.signInFailures.set(key, (this.signInFailures.get(key) ?? 0) + 1);
      return route.fulfill({ status: 401, json: { code: 'invalid-credentials' } });
    }
    if (MFA_ROLES.has(membership.role)) {
      this.mfaPending = membership.id;
      return route.fulfill({ json: { status: 'mfa-required' } });
    }
    this.startSession(membership.id);
    return route.fulfill({ json: { status: 'signed-in' } });
  }

  private async mfa(route: Route): Promise<void> {
    const { code } = route.request().postDataJSON() as { code: string };
    if (!this.mfaPending) {
      return route.fulfill({ status: 401, json: { code: 'mfa-expired' } });
    }
    if (code !== seededMfaCode) {
      return route.fulfill({ status: 401, json: { code: 'invalid-code' } });
    }
    this.startSession(this.mfaPending);
    this.mfaPending = null;
    return route.fulfill({ json: { status: 'signed-in' } });
  }

  private async signOut(route: Route): Promise<void> {
    if (!this.membershipId) {
      return this.unauthenticated(route);
    }
    this.membershipId = null;
    return route.fulfill({ status: 204 });
  }

  /** Modules on for the signed-in organization, or a 401/403 answer when the caller may not manage them. */
  private async settingsCaller(route: Route): Promise<string | null> {
    const membership = memberships.find((m) => m.id === this.membershipId);
    if (!membership) {
      await this.unauthenticated(route);
      return null;
    }
    if (!['Admin', 'ProgramDirector'].includes(membership.role)) {
      await route.fulfill({ status: 403, json: { code: 'forbidden' } });
      return null;
    }
    return membership.organizationId;
  }

  private async getModules(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const on = this.modules.get(organizationId)!;
    return route.fulfill({
      json: { modules: moduleCatalog.map((m) => ({ id: m.id, name: m.name, on: on.includes(m.id), needs: m.needs })) },
    });
  }

  private async saveModules(route: Route): Promise<void> {
    const organizationId = await this.settingsCaller(route);
    if (!organizationId) return;
    const { on } = route.request().postDataJSON() as { on: ModuleId[] };
    const errors: { module: string; message: string }[] = [];
    const name = (id: ModuleId) => moduleCatalog.find((m) => m.id === id)!.name;
    if (!on.includes('Roster')) {
      const dependents = moduleCatalog.filter((m) => on.includes(m.id) && m.needs.includes('Roster')).map((m) => m.name);
      if (dependents.length) {
        const list = dependents.length === 1 ? dependents[0] : `${dependents.slice(0, -1).join(', ')} and ${dependents.at(-1)}`;
        errors.push({ module: 'Roster', message: `${list} ${dependents.length === 1 ? 'needs' : 'need'} the roster.` });
      }
    }
    for (const m of moduleCatalog.filter((c) => on.includes(c.id))) {
      const missing = m.needs.filter((n) => n !== 'Roster' && !on.includes(n));
      if (missing.length) errors.push({ module: m.id, message: `${m.name} needs ${missing.map(name).join(' and ')}.` });
    }
    if (errors.length) {
      return route.fulfill({ status: 422, json: { errors } });
    }
    this.modules.set(organizationId, moduleCatalog.map((m) => m.id).filter((id) => on.includes(id)));
    return route.fulfill({ json: { on: on.length } });
  }

  /** The signed-in membership when Roster is on for its organization; otherwise answers 401 or 404 and returns null. */
  private async rosterCaller(route: Route): Promise<Membership | null> {
    const membership = memberships.find((m) => m.id === this.membershipId);
    if (!membership) {
      await this.unauthenticated(route);
      return null;
    }
    if (!this.modules.get(membership.organizationId)!.includes('Roster')) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return membership;
  }

  private ownHousehold(m: Membership, id: string): FakeHousehold | undefined {
    return this.households.find((h) => h.id === id && h.organizationId === m.organizationId);
  }

  private ownChild(m: Membership, id: string) {
    for (const h of this.households.filter((x) => x.organizationId === m.organizationId)) {
      const child = h.children.find((c) => c.id === id);
      if (child) return { household: h, child };
    }
    return undefined;
  }

  private forbidden(route: Route): Promise<void> {
    return route.fulfill({ status: 403, json: { code: 'forbidden' } });
  }

  private async listHouseholds(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const url = new URL(route.request().url());
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    const filter = url.searchParams.get('filter');
    const rows = this.households
      .filter((h) => h.organizationId === m.organizationId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((h) => {
        const children = [...h.children].sort((a, b) => (ageOf(a.dateOfBirth) ?? 99) - (ageOf(b.dateOfBirth) ?? 99));
        const guardians = [...h.guardians].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
        const summary = {
          id: h.id,
          name: h.name,
          primaryGuardian: guardians[0]?.name ?? null,
          children: children.map((c) => (ageOf(c.dateOfBirth) !== null ? `${c.firstName} (${ageOf(c.dateOfBirth)})` : c.firstName)),
          language: h.language,
          medicalFlags: children.filter(hasMedicalFlag).length,
          missingInfo: !guardians.some(reachable),
        };
        const text = [h.name, ...guardians.map((g) => `${g.name} ${g.mobile ?? ''} ${g.email ?? ''}`), ...children.map((c) => `${c.firstName} ${c.lastName}`)]
          .join(' ')
          .toLowerCase();
        return { summary, text };
      });
    const counts = {
      all: rows.length,
      missingInfo: rows.filter((r) => r.summary.missingInfo).length,
      spanish: rows.filter((r) => r.summary.language === 'Spanish').length,
      french: rows.filter((r) => r.summary.language === 'French').length,
      children: rows.reduce((n, r) => n + r.summary.children.length, 0),
    };
    const households = rows
      .filter((r) => !q || r.text.includes(q))
      .filter((r) =>
        filter === 'missing-info' ? r.summary.missingInfo : filter === 'spanish' ? r.summary.language === 'Spanish' : filter === 'french' ? r.summary.language === 'French' : true,
      )
      .map((r) => r.summary);
    return route.fulfill({ json: { households, counts } });
  }

  private async getHousehold(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const h = this.ownHousehold(m, id);
    if (!h) return route.fulfill({ status: 404 });
    const medical = can.readMedical(m);
    return route.fulfill({
      json: {
        id: h.id,
        name: h.name,
        language: h.language,
        guardians: [...h.guardians].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name)).map(({ emailBounced: _, ...g }) => g),
        children: [...h.children]
          .sort((a, b) => (ageOf(a.dateOfBirth) ?? 99) - (ageOf(b.dateOfBirth) ?? 99))
          .map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, age: ageOf(c.dateOfBirth), school: c.school, medicalFlag: medical ? medicalFlag(c) : null })),
        medicalRestricted: !medical,
      },
    });
  }

  private async createHousehold(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.writeHouseholds(m)) return this.forbidden(route);
    const body = route.request().postDataJSON() as { guardianName: string; mobile: string; email: string; language: string };
    const errors: Record<string, string> = {};
    if (!body.guardianName?.trim()) errors['guardianName'] = 'Enter the guardian’s name.';
    if (!body.mobile?.trim() && !body.email?.trim()) errors['mobile'] = 'Enter a mobile number or an email.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const name = body.guardianName.trim();
    const last = name.includes(' ') ? name.slice(name.indexOf(' ') + 1) : name;
    const id = `hh-new-${this.nextId++}`;
    this.households.push({
      id,
      organizationId: m.organizationId,
      name: last,
      language: body.language,
      guardians: [{ id: `g-new-${this.nextId++}`, name, relationship: 'Guardian', mobile: body.mobile?.trim() || null, email: body.email?.trim() || null, language: body.language, isPrimary: true, canPickUp: true, canSign: true }],
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
    const body = route.request().postDataJSON() as { name: string; dateOfBirth: string | null; school: string; allergies: string };
    const errors: Record<string, string> = {};
    if (!body.name?.trim()) errors['name'] = 'Enter the child’s name.';
    if (!body.dateOfBirth) errors['dateOfBirth'] = 'Enter the date of birth.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const name = body.name.trim();
    const space = name.indexOf(' ');
    const id = `c-new-${this.nextId++}`;
    const allergies = body.allergies?.trim() && body.allergies.trim().toLowerCase() !== 'none' ? body.allergies.trim() : null;
    h.children.push({
      id,
      firstName: space < 0 ? name : name.slice(0, space),
      lastName: space < 0 ? '' : name.slice(space + 1),
      dateOfBirth: body.dateOfBirth,
      school: body.school?.trim() || null,
      medical: { allergies, medication: null, conditions: null, doctor: null, redAlert: false, updatedAt: allergies ? '2026-11-05T21:12:00Z' : null, updatedBy: allergies ? m.personName : null },
    });
    return route.fulfill({ status: 201, json: { id } });
  }

  private async addGuardian(route: Route, householdId: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.writeHouseholds(m)) return this.forbidden(route);
    const h = this.ownHousehold(m, householdId);
    if (!h) return route.fulfill({ status: 404 });
    const body = route.request().postDataJSON() as { name: string; relationship: string; mobile: string; email: string; language: string; canPickUp: boolean; canSign: boolean };
    const errors: Record<string, string> = {};
    if (!body.name?.trim()) errors['name'] = 'Enter the guardian’s name.';
    if (!body.mobile?.trim() && !body.email?.trim()) errors['mobile'] = 'Enter a mobile number or an email.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const id = `g-new-${this.nextId++}`;
    h.guardians.push({ id, name: body.name.trim(), relationship: body.relationship, mobile: body.mobile?.trim() || null, email: body.email?.trim() || null, language: body.language || h.language, isPrimary: false, canPickUp: body.canPickUp, canSign: body.canSign });
    return route.fulfill({ status: 201, json: { id } });
  }

  private async updateGuardian(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.writeHouseholds(m)) return this.forbidden(route);
    const g = this.households.filter((h) => h.organizationId === m.organizationId).flatMap((h) => h.guardians).find((x) => x.id === id);
    if (!g) return route.fulfill({ status: 404 });
    const body = route.request().postDataJSON() as { name: string; relationship: string; mobile: string; canPickUp: boolean; canSign: boolean };
    if (!body.name?.trim()) return route.fulfill({ status: 422, json: { errors: { name: 'Enter the guardian’s name.' } } });
    Object.assign(g, { name: body.name.trim(), relationship: body.relationship, mobile: body.mobile?.trim() || null, canPickUp: body.canPickUp, canSign: body.canSign });
    return route.fulfill({ status: 204 });
  }

  private async getChild(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const found = this.ownChild(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const { household, child } = found;
    const medical = can.readMedical(m);
    return route.fulfill({
      json: {
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        firstName: child.firstName,
        lastName: child.lastName,
        dateOfBirth: child.dateOfBirth,
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
    const body = route.request().postDataJSON() as { name: string; dateOfBirth: string | null; school: string };
    const errors: Record<string, string> = {};
    if (!body.name?.trim()) errors['name'] = 'Enter the child’s name.';
    if (!body.dateOfBirth) errors['dateOfBirth'] = 'Enter the date of birth.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const name = body.name.trim();
    const space = name.indexOf(' ');
    Object.assign(found.child, {
      firstName: space < 0 ? name : name.slice(0, space),
      lastName: space < 0 ? '' : name.slice(space + 1),
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
    const body = route.request().postDataJSON() as { allergies: string; medication: string; conditions: string; doctor: string; redAlert: boolean; alertInstruction: string };
    const clean = (v: string) => v?.trim() || null;
    found.child.medical = {
      allergies: clean(body.allergies),
      medication: clean(body.medication),
      conditions: clean(body.conditions),
      doctor: clean(body.doctor),
      redAlert: body.redAlert,
      alertInstruction: clean(body.alertInstruction),
      healthCard: found.child.medical.healthCard ?? null,
      updatedAt: '2026-11-05T21:12:00Z',
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
    const body = route.request().postDataJSON() as { reason: string; confirmName: string };
    if (body.confirmName?.trim().toLowerCase() !== h.name.toLowerCase()) {
      return route.fulfill({ status: 422, json: { errors: { confirmName: `Type ${h.name} to confirm.` } } });
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
    const q = (new URL(route.request().url()).searchParams.get('q') ?? '').trim().toLowerCase();
    const children = !q
      ? []
      : this.childrenOf(m)
          .filter(({ child }) => `${child.firstName} ${child.lastName}`.toLowerCase().includes(q))
          .map(({ child, household }) => ({ id: child.id, name: `${child.firstName} ${child.lastName}`, age: ageOf(child.dateOfBirth), householdId: household.id, householdName: household.name }));
    return route.fulfill({ json: { children } });
  }

  private ownProgram(m: Membership, id: string): FakeProgram | undefined {
    return this.programs.find((p) => p.id === id && p.organizationId === m.organizationId);
  }

  private async listPrograms(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const status = new URL(route.request().url()).searchParams.get('status') === 'archived' ? 'Archived' : 'Active';
    const own = this.programs.filter((p) => p.organizationId === m.organizationId).sort((a, b) => a.startsOn.localeCompare(b.startsOn) || a.name.localeCompare(b.name));
    const active = own.filter((p) => p.status === 'Active');
    return route.fulfill({
      json: {
        programs: own
          .filter((p) => p.status === status)
          .map((p) => ({ id: p.id, name: p.name, schedule: p.schedule, startsOn: p.startsOn, endsOn: p.endsOn, enrolled: p.roster.length, capacity: p.capacity, enrollmentOpen: p.enrollmentOpen, status: p.status })),
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
      .sort((a, b) => a!.child.lastName.localeCompare(b!.child.lastName) || a!.child.firstName.localeCompare(b!.child.firstName))
      .map((x) => ({ id: x!.child.id, householdId: x!.household.id, name: `${x!.child.firstName} ${x!.child.lastName}`, age: ageOf(x!.child.dateOfBirth), householdName: x!.household.name }));
    const { roster: _, organizationId: __, ...rest } = p;
    const slug = this.enrollmentSlugs.get(p.id);
    return route.fulfill({
      json: {
        ...rest,
        enrollmentUrl: slug ? `http://localhost:4317/g/enroll/${slug}` : null,
        pendingReviews: this.enrollmentRequests.filter((r) => r.programId === p.id && r.status === 'WaitingReview').length,
        waitlisted: this.enrollmentRequests.filter((r) => r.programId === p.id && r.status === 'Waitlisted').length,
        enrolled: roster.length,
        roster,
        events: this.events
          .filter((e) => e.programId === p.id)
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
          .map((e) => ({ id: e.id, name: e.name, startsAt: e.startsAt, endsAt: e.endsAt, status: e.status })),
      },
    });
  }

  private async saveProgram(route: Route, id: string | null): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    const existing = id ? this.ownProgram(m, id) : undefined;
    if (id && !existing) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as { name: string; startsOn: string | null; endsOn: string | null; schedule: string; capacity: number; ages: string; enrollmentOpen: boolean; seasonConsent: boolean };
    const errors: Record<string, string> = {};
    if (!b.name?.trim()) errors['name'] = 'Enter the program name.';
    if (!b.startsOn) errors['startsOn'] = 'Enter the start date.';
    if (!b.endsOn) errors['endsOn'] = 'Enter the end date.';
    else if (b.startsOn && b.endsOn < b.startsOn) errors['endsOn'] = 'End after it starts.';
    if (!(b.capacity >= 1)) errors['capacity'] = 'Enter a capacity of 1 or more.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const values = {
      name: b.name.trim(),
      startsOn: b.startsOn!,
      endsOn: b.endsOn!,
      schedule: b.schedule?.trim() || null,
      capacity: b.capacity,
      ages: b.ages?.trim() || null,
      enrollmentOpen: b.enrollmentOpen,
      seasonConsent: b.seasonConsent,
    };
    if (existing) {
      Object.assign(existing, values);
      return route.fulfill({ status: 204 });
    }
    const newId = `p-new-${this.nextId++}`;
    this.programs.push({ id: newId, organizationId: m.organizationId, ...values, status: 'Active', archivedAt: null, archivedBy: null, roster: [] });
    return route.fulfill({ status: 201, json: { id: newId } });
  }

  private async archiveProgram(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    const p = this.ownProgram(m, id);
    if (!p) return route.fulfill({ status: 404 });
    const { confirmName } = route.request().postDataJSON() as { confirmName: string };
    if (confirmName?.trim().toLowerCase() !== p.name.toLowerCase()) {
      return route.fulfill({ status: 422, json: { errors: { confirmName: `Type ${p.name} to confirm.` } } });
    }
    Object.assign(p, { status: 'Archived', enrollmentOpen: false, archivedAt: NOW.toISOString(), archivedBy: m.personName });
    return route.fulfill({ status: 204 });
  }

  private async restoreProgram(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    const p = this.ownProgram(m, id);
    if (!p) return route.fulfill({ status: 404 });
    Object.assign(p, { status: 'Active', archivedAt: null, archivedBy: null });
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
    const invalid = (message: string) => route.fulfill({ status: 422, json: { errors: { childId: message } } });
    if (!found) return invalid('Choose a child from your roster.');
    if (p.status === 'Archived') return invalid(`${p.name} is archived.`);
    if (p.roster.includes(childId)) return invalid(`${found.child.firstName} ${found.child.lastName} is already enrolled.`);
    if (p.roster.length >= p.capacity) return invalid(`${p.name} is full (${p.roster.length} of ${p.capacity}).`);
    p.roster.push(childId);
    return route.fulfill({ status: 201, json: { id: `en-${this.nextId++}` } });
  }

  private async unenroll(route: Route, id: string, childId: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    const p = this.ownProgram(m, id);
    if (!p || !p.roster.includes(childId)) return route.fulfill({ status: 404 });
    p.roster = p.roster.filter((c) => c !== childId);
    return route.fulfill({ status: 204 });
  }

  /** Roles that run sessions without running any session (youth workers) open only the ones they are assigned to. */
  private mayRun(m: Membership, eventId: string): boolean {
    return !can.runSessions(m) || can.runAnySession(m) || (this.sessionStaff.get(eventId) ?? []).includes(m.id);
  }

  private ownEvent(m: Membership, id: string): FakeEvent | undefined {
    return this.events.find((e) => e.id === id && e.organizationId === m.organizationId);
  }

  private eventSummary(e: FakeEvent) {
    const p = this.programs.find((x) => x.id === e.programId)!;
    return { id: e.id, name: e.name, programId: p.id, programName: p.name, startsAt: e.startsAt, endsAt: e.endsAt, place: e.place, rosterSize: p.roster.length, slipStatus: e.slipStatus, status: e.status };
  }

  private async listEvents(route: Route): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const url = new URL(route.request().url());
    const filter = url.searchParams.get('filter');
    const programId = url.searchParams.get('programId');
    const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    const now = NOW.toISOString();
    const own = this.events.filter((e) => e.organizationId === m.organizationId);
    const upcoming = own.filter((e) => e.endsAt >= now).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const needSlips = upcoming.filter((e) => e.status === 'Scheduled' && e.slipStatus === 'Draft');
    const chosen =
      filter === 'past' ? own.filter((e) => e.endsAt < now).sort((a, b) => b.startsAt.localeCompare(a.startsAt)) : filter === 'needs-slips' ? needSlips : upcoming;
    const events = chosen
      .map((e) => this.eventSummary(e))
      .filter((e) => !programId || e.programId === programId)
      .filter((e) => !q || `${e.name} ${e.programName} ${e.place ?? ''}`.toLowerCase().includes(q));
    return route.fulfill({ json: { events, upcoming: upcoming.length, needSlips: needSlips.length } });
  }

  private async getEvent(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
    const { organizationId: _, ...rest } = e;
    return route.fulfill({ json: { ...rest, programName: this.eventSummary(e).programName, rosterSize: this.eventSummary(e).rosterSize } });
  }

  private async saveEvent(route: Route, id: string | null): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.manageEvents(m)) return this.forbidden(route);
    const existing = id ? this.ownEvent(m, id) : undefined;
    if (id && !existing) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as { name: string; programId: string; startsAt: string | null; endsAt: string | null; place: string; requiresSlip: boolean; noShowAlert: boolean; staffNotes: string };
    const errors: Record<string, string> = {};
    if (!b.name?.trim()) errors['name'] = 'Enter the event name.';
    const program = this.ownProgram(m, b.programId);
    if (!program || program.status !== 'Active') errors['programId'] = 'Choose an active program.';
    if (!b.startsAt) errors['startsAt'] = 'Enter when it starts.';
    if (!b.endsAt) errors['endsAt'] = 'Enter when it ends.';
    else if (b.startsAt && new Date(b.endsAt) <= new Date(b.startsAt)) errors['endsAt'] = 'End after it starts.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
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
      Object.assign(existing, values, { slipStatus: values.requiresSlip ? (existing.slipStatus === 'NotNeeded' ? 'Draft' : existing.slipStatus) : 'NotNeeded' });
      return route.fulfill({ status: 204 });
    }
    const newId = `e-new-${this.nextId++}`;
    this.events.push({
      id: newId,
      organizationId: m.organizationId,
      ...values,
      status: 'Scheduled',
      slipStatus: values.requiresSlip ? 'Draft' : 'NotNeeded',
      cancelledAt: null,
      cancelledBy: null,
      cancellationMessage: null,
      guardiansTold: false,
    });
    return route.fulfill({ status: 201, json: { id: newId } });
  }

  private async cancelEvent(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.cancelEvents(m)) return this.forbidden(route);
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as { message: string; tellGuardians: boolean };
    if (b.tellGuardians && !b.message?.trim()) return route.fulfill({ status: 422, json: { errors: { message: 'Write the message to guardians.' } } });
    Object.assign(e, { status: 'Cancelled', cancelledAt: NOW.toISOString(), cancelledBy: m.personName, cancellationMessage: b.message?.trim() || null, guardiansTold: b.tellGuardians });
    return route.fulfill({ status: 204 });
  }

  /** The signed-in membership when Roll Call is on for its organization. */
  private async rollCallCaller(route: Route): Promise<Membership | null> {
    const membership = memberships.find((m) => m.id === this.membershipId);
    if (!membership) {
      await this.unauthenticated(route);
      return null;
    }
    if (!this.modules.get(membership.organizationId)!.includes('RollCall')) {
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
    const checkedIn = ids.filter((id) => ['Present', 'SignedOut'].includes(records.get(id)?.status ?? '')).length;
    const absent = ids.filter((id) => records.get(id)?.status === 'Absent').length;
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
      status: e.status,
    };
  }

  private async todaySessions(route: Route): Promise<void> {
    const m = await this.rollCallCaller(route);
    if (!m) return;
    // "Today" is 5 November 2026 in Hamilton: 05:00Z to the next 05:00Z.
    const start = '2026-11-05T05:00:00.000Z';
    const end = '2026-11-06T05:00:00.000Z';
    const sessions = this.events
      .filter((e) => e.organizationId === m.organizationId && e.status === 'Scheduled' && e.startsAt < end && e.endsAt > start)
      .filter((e) => this.mayRun(m, e.id))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map((e) => this.sessionSummary(e));
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
        status: records.get(child.id)?.status ?? 'NotYet',
        checkedInAt: records.get(child.id)?.checkedInAt ?? null,
        walkIn: false,
        signedOutAt: records.get(child.id)?.signedOutAt ?? null,
        collectedBy: records.get(child.id)?.collectedBy ?? null,
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
        medicalFlag: can.readMedical(m) && w.medicalNotes ? 'Medical note' : null,
        status: records.get(w.id)?.status ?? 'NotYet',
        checkedInAt: records.get(w.id)?.checkedInAt ?? null,
        walkIn: true,
        signedOutAt: records.get(w.id)?.signedOutAt ?? null,
        collectedBy: records.get(w.id)?.collectedBy ?? null,
      }));
    return route.fulfill({ json: { session: this.sessionSummary(e), children: [...children, ...walkIns].sort((a, b) => a.name.localeCompare(b.name)) } });
  }

  private async attend(route: Route, id: string, status: 'Present' | 'Absent'): Promise<void> {
    const m = await this.rollCallCaller(route);
    if (!m) return;
    if (!can.runSessions(m)) return this.forbidden(route);
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
    if (!this.mayRun(m, e.id)) return this.forbidden(route);
    const b = route.request().postDataJSON() as { childId: string; arrivedAt?: string | null; clientActionId: string };
    if (this.actions.has(b.clientActionId)) return route.fulfill({ json: { status: 'saved' } });
    if (e.status === 'Cancelled') return route.fulfill({ status: 422, json: { errors: { session: 'This session is cancelled.' } } });
    const p = this.programs.find((x) => x.id === e.programId)!;
    if (!p.roster.includes(b.childId)) {
      return route.fulfill({ status: 422, json: { errors: { childId: 'This child is not on tonight’s roster. Add a walk-in instead.' } } });
    }
    this.actions.add(b.clientActionId);
    this.sessionRecords(e.id).set(b.childId, { status, checkedInAt: status === 'Present' ? (b.arrivedAt ?? NOW.toISOString()) : null });
    return route.fulfill({ json: { status: 'saved' } });
  }

  private async addWalkIn(route: Route, id: string): Promise<void> {
    const m = await this.rollCallCaller(route);
    if (!m) return;
    if (!can.runSessions(m)) return this.forbidden(route);
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
    if (!this.mayRun(m, e.id)) return this.forbidden(route);
    const b = route.request().postDataJSON() as { childName: string; guardian: string; medicalNotes: string };
    const errors: Record<string, string> = {};
    if (!b.childName?.trim()) errors['childName'] = 'Enter the child’s name.';
    if (!b.guardian?.trim()) errors['guardian'] = 'Enter the guardian’s name and phone.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const walkIn = { id: `w-${this.nextId++}`, eventId: e.id, childName: b.childName.trim(), guardian: b.guardian.trim(), medicalNotes: b.medicalNotes?.trim() || null };
    this.walkIns.push(walkIn);
    this.sessionRecords(e.id).set(walkIn.id, { status: 'Present', checkedInAt: NOW.toISOString() });
    return route.fulfill({ status: 201, json: { id: walkIn.id } });
  }

  /** Pickup needs Roll Call, so the caller must pass both module checks. */
  private async pickupCaller(route: Route): Promise<Membership | null> {
    const m = await this.rollCallCaller(route);
    if (!m) return null;
    if (!this.modules.get(m.organizationId)!.includes('Pickup')) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return m;
  }

  private sortedGuardians(household: FakeHousehold): FakeGuardian[] {
    return [...household.guardians].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name));
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
        approved: guardians.filter((g) => g.canPickUp).map((g) => ({ guardianId: g.id, name: g.name, relationship: g.relationship, isPrimary: g.isPrimary })),
      },
    });
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
    if (this.actions.has(b.clientActionId)) return route.fulfill({ json: { status: 'saved' } });
    const found = this.ownChild(m, b.childId);
    const record = this.sessionRecords(e.id).get(b.childId);
    if (found && record?.status !== 'Present') {
      return route.fulfill({ status: 422, json: { errors: { childId: `${found.child.firstName} ${found.child.lastName} is not checked in.` } } });
    }
    const guardians = found ? this.sortedGuardians(found.household) : [];
    const primary = guardians[0];
    const first = found?.child.firstName ?? 'the child';
    const errors: Record<string, string> = {};
    let collectedBy: string | null = null;
    if (b.guardianId) {
      const g = guardians.find((x) => x.id === b.guardianId && x.canPickUp);
      if (!g) errors['who'] = `Not on ${first}’s approved list. Call ${primary?.name} at ${primary?.mobile} before ${first} leaves.`;
      collectedBy = g?.name ?? null;
    } else if (b.someoneElse) {
      if (!b.otherName?.trim()) errors['otherName'] = 'Enter their name.';
      if (!b.guardianConfirmed) errors['guardianConfirmed'] = `${primary?.name ?? 'The guardian'} needs to okay this by phone first.`;
      collectedBy = b.otherName?.trim() ?? null;
    } else {
      errors['who'] = `Choose who is taking ${first} home.`;
    }
    if (!b.idChecked) errors['idChecked'] = 'Check photo ID, or confirm you know this person.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    this.actions.add(b.clientActionId);
    this.sessionRecords(e.id).set(b.childId, { ...record!, status: 'SignedOut', signedOutAt: b.leftAt ?? NOW.toISOString(), collectedBy });
    return route.fulfill({ json: { status: 'saved' } });
  }

  private async messagingCaller(route: Route): Promise<Membership | null> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      await this.unauthenticated(route);
      return null;
    }
    if (!this.modules.get(m.organizationId)!.includes('Messages')) {
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
    const cap = plan === 'Free' ? 200 : plan === 'Standard' ? 2000 : 5000;
    const used = this.smsUsed.get(m.organizationId) ?? 0;
    return { cap, used, remaining: Math.max(0, cap - used) };
  }

  /** Households with children enrolled in the program (or the event's program), each with the channel that reaches its primary guardian. */
  private audienceOf(m: Membership, b: AudienceBody) {
    const programId = b.eventId ? this.ownEvent(m, b.eventId)?.programId : b.programId;
    const programs = this.programs.filter((p) => p.organizationId === m.organizationId && (!programId || p.id === programId));
    const childIds = new Set(programs.flatMap((p) => p.roster));
    const label = b.eventId ? (this.ownEvent(m, b.eventId)?.name ?? 'All programs') : (programs.length === 1 && programId ? programs[0]!.name : 'All programs');
    const recipients = this.households
      .filter((h) => h.organizationId === m.organizationId && h.children.some((c) => childIds.has(c.id)) && (!b.language || h.language === b.language))
      .sort((a, z) => a.name.localeCompare(z.name))
      .map((h) => {
        const g = this.sortedGuardians(h)[0];
        const mobile = g?.mobile || null;
        const email = g?.email && !g.emailBounced ? g.email : null;
        const base = { household: h.name.replace(/ household$/, ''), guardian: g?.name ?? null, language: h.language };
        if (b.channel === 'TextOnly') return { ...base, channel: 'Sms' as const, to: mobile, fallback: null, unreachable: mobile ? null : 'No mobile number' };
        if (b.channel === 'EmailOnly') return { ...base, channel: 'Email' as const, to: email, fallback: null, unreachable: email ? null : 'No email address' };
        return mobile
          ? { ...base, channel: 'Sms' as const, to: mobile, fallback: email, unreachable: null }
          : { ...base, channel: 'Email' as const, to: email, fallback: null, unreachable: email ? null : 'No mobile number or email' };
      });
    return { label: b.language ? `${label} · ${b.language} households` : label, recipients };
  }

  private async previewMessage(route: Route): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const b = route.request().postDataJSON() as AudienceBody;
    const { recipients } = this.audienceOf(m, b);
    const org = organizations.find((o) => o.id === m.organizationId)!;
    const text = `${org.name}: ${(b.body ?? '').trim()}`;
    const segments = segmentsOf(text);
    const reachable = recipients.filter((r) => !r.unreachable);
    const texts = reachable.filter((r) => r.channel === 'Sms');
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
        fallingBackToEmail: texts.slice(textable).filter((r) => r.fallback).length,
      },
    });
  }

  /** Creates the message and runs the send job at once: texts within the cap, email instead or paused beyond it. */
  private async sendMessage(route: Route): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const b = route.request().postDataJSON() as AudienceBody;
    const body = (b.body ?? '').trim();
    const { label, recipients } = this.audienceOf(m, b);
    const errors: Record<string, string> = {};
    if (!body) errors['body'] = 'Enter a message.';
    else if (body.length > 480) errors['body'] = 'Keep it to 480 characters.';
    if (recipients.length === 0) errors['audience'] = 'Nobody matches. Loosen a filter.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const org = organizations.find((o) => o.id === m.organizationId)!;
    const segments = segmentsOf(`${org.name}: ${body}`);
    const now = NOW.toISOString();
    const deliveries: FakeDelivery[] = recipients.map((r) => {
      const base = { household: r.household, guardian: r.guardian, language: r.language, at: null as string | null };
      if (r.unreachable) return { ...base, channel: r.channel, status: 'Failed', reason: r.unreachable };
      if (r.channel === 'Email') return { ...base, channel: 'Email', status: 'Sent', reason: null, at: now };
      const { remaining, used } = this.capOf(m);
      if (remaining >= segments) {
        this.smsUsed.set(m.organizationId, used + segments);
        return { ...base, channel: 'Sms', status: 'Sent', reason: null, at: now };
      }
      return r.fallback
        ? { ...base, channel: 'Email', status: 'FellBackToEmail', reason: 'SMS cap reached', at: now }
        : { ...base, channel: 'Sms', status: 'Paused', reason: 'SMS cap reached' };
    });
    const id = `msg-${this.nextId++}`;
    this.messages.unshift({ id, organizationId: m.organizationId, title: titleOf(body), body, sentAt: now, sentBy: m.personName, audience: label, channel: b.channel, deliveries });
    return route.fulfill({ status: 201, json: { id } });
  }

  private counts(d: FakeDelivery[]) {
    return {
      deliveredCount: d.filter((x) => x.status === 'Sent' || x.status === 'FellBackToEmail').length,
      failedCount: d.filter((x) => x.status === 'Failed').length,
      pausedCount: d.filter((x) => x.status === 'Paused').length,
    };
  }

  private async listMessages(route: Route): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const { cap, used } = this.capOf(m);
    const messages = this.messages
      .filter((x) => x.organizationId === m.organizationId)
      .map((x) => ({ id: x.id, title: x.title, sentAt: x.sentAt, sentBy: x.sentBy, recipientCount: x.deliveries.length, audience: x.audience, channel: x.channel, status: 'Sent', ...this.counts(x.deliveries) }));
    return route.fulfill({ json: { messages, segmentsUsed: used, segmentCap: cap } });
  }

  private async getMessage(route: Route, id: string): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const x = this.messages.find((y) => y.id === id && y.organizationId === m.organizationId);
    if (!x) return route.fulfill({ status: 404 });
    const org = organizations.find((o) => o.id === m.organizationId)!;
    const smsText = `${org.name}: ${x.body}`;
    const problem = (d: FakeDelivery) => (d.status === 'Failed' || d.status === 'Paused' ? 0 : 1);
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
        status: 'Sent',
        recipientCount: x.deliveries.length,
        ...this.counts(x.deliveries),
        languages: [...new Set(x.deliveries.map((d) => d.language))].sort(),
        deliveries: [...x.deliveries].sort((a, z) => problem(a) - problem(z) || a.household.localeCompare(z.household)),
      },
    });
  }

  private async smsCap(route: Route): Promise<void> {
    const m = await this.messagingCaller(route);
    if (!m) return;
    const { cap, used, remaining } = this.capOf(m);
    return route.fulfill({ json: { cap, used, remaining, state: remaining === 0 ? 'Reached' : 'Ok', period: '2026-11' } });
  }

  private async reviewCaller(route: Route): Promise<Membership | null> {
    const m = await this.rosterCaller(route);
    if (!m) return null;
    if (!['Admin', 'ProgramDirector'].includes(m.role)) {
      await this.forbidden(route);
      return null;
    }
    return m;
  }

  private async listEnrollmentRequests(route: Route, programId: string): Promise<void> {
    const m = await this.reviewCaller(route);
    if (!m) return;
    if (!this.ownProgram(m, programId)) return route.fulfill({ status: 404 });
    const status = new URL(route.request().url()).searchParams.get('status') ?? 'WaitingReview';
    const enrolledAnywhere = new Set(this.programs.flatMap((x) => x.roster));
    const requests = this.enrollmentRequests
      .filter((r) => r.programId === programId && r.status === status && r.childId)
      .map((r) => {
        const { child, household } = this.childrenOf(m).find((x) => x.child.id === r.childId)!;
        const g = this.sortedGuardians(household)[0];
        const medical = [child.medical.allergies, child.medical.medication].filter(Boolean).join('; ');
        return { id: r.id!, childId: child.id, householdId: household.id, child: `${child.firstName} ${child.lastName}`, age: ageOf(child.dateOfBirth), guardian: g?.name ?? '', phone: g?.mobile ?? null, language: household.language, medical: medical || null, returning: enrolledAnywhere.has(child.id), submittedAt: r.submittedAt!, status: r.status, position: r.position };
      })
      .sort((a, z) => (status === 'Waitlisted' ? (a.position ?? 0) - (z.position ?? 0) : a.child.localeCompare(z.child)));
    return route.fulfill({ json: { requests } });
  }

  private async reviewEnrollments(route: Route, id: string | null): Promise<void> {
    const m = await this.reviewCaller(route);
    if (!m) return;
    const b = route.request().postDataJSON() as { ids?: string[]; decision: 'Accept' | 'Waitlist' | 'Decline'; note?: string | null };
    const ids = id ? [id] : (b.ids ?? []);
    const requests = this.enrollmentRequests.filter((r) => r.id && ids.includes(r.id) && this.ownProgram(m, r.programId));
    if (!requests.length || requests.length !== ids.length) return route.fulfill({ status: 404 });
    if (requests.some((r) => r.status === 'Accepted' || r.status === 'Declined' || (b.decision === 'Waitlist' && r.status === 'Waitlisted'))) return route.fulfill({ status: 409, json: { code: 'conflict' } });
    const note = b.note?.trim() || null;
    if (b.decision === 'Decline' && !note) return route.fulfill({ status: 422, json: { errors: { note: 'Write a reason the guardian will read.' } } });
    const program = this.programs.find((x) => x.id === requests[0]!.programId)!;
    if (b.decision === 'Accept' && program.roster.length + requests.length > program.capacity) {
      return route.fulfill({ status: 422, json: { errors: { decision: `${program.name} is full (${program.roster.length} of ${program.capacity}). Waitlist instead.` } } });
    }
    let position = Math.max(0, ...this.enrollmentRequests.filter((r) => r.programId === program.id && r.status === 'Waitlisted').map((r) => r.position ?? 0));
    for (const r of requests) {
      const leftPlace = r.status === 'Waitlisted' ? r.position : null;
      if (leftPlace !== null) {
        for (const behind of this.enrollmentRequests.filter((x) => x.programId === program.id && x.status === 'Waitlisted' && (x.position ?? 0) > leftPlace)) behind.position = behind.position! - 1;
        position--;
      }
      if (b.decision === 'Accept') {
        r.status = 'Accepted';
        if (!program.roster.includes(r.childId!)) program.roster.push(r.childId!);
      } else if (b.decision === 'Waitlist') {
        r.status = 'Waitlisted';
        r.position = ++position;
      } else {
        r.status = 'Declined';
      }
      r.note = note;
    }
    return route.fulfill({ status: 204 });
  }

  private async openEnrollmentRoute(route: Route, id: string): Promise<void> {
    const m = await this.rosterCaller(route);
    if (!m) return;
    if (!can.managePrograms(m)) return this.forbidden(route);
    if (!this.ownProgram(m, id)) return route.fulfill({ status: 404 });
    return route.fulfill({ json: { url: `http://localhost:4317/g/enroll/${this.openEnrollment(id)}` } });
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
    const programId = [...this.enrollmentSlugs.entries()].find(([, s]) => s === slug)?.[0];
    const program = programId ? this.programs.find((x) => x.id === programId) : undefined;
    const org = program ? organizations.find((o) => o.id === program.organizationId) : undefined;
    if (!program || !org || !this.modules.get(org.id)!.includes('Roster')) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return { program, org };
  }

  private enrollContact(typed: string): string | null {
    const value = (typed ?? '').trim();
    if (value.includes('@')) return value.toLowerCase();
    const digits = value.replace(/\D/g, '').slice(-10);
    return digits.length === 10 ? digits : null;
  }

  private async enrollPage(route: Route, slug: string): Promise<void> {
    const scope = await this.enrollScope(route, slug);
    if (!scope) return;
    const { program, org } = scope;
    return route.fulfill({ json: { program: program.name, organization: org.name, phone: '905-555-0100', open: program.enrollmentOpen, schedule: program.schedule, ages: program.ages, startsOn: program.startsOn } });
  }

  private async enrollCode(route: Route, slug: string): Promise<void> {
    const scope = await this.enrollScope(route, slug);
    if (!scope) return;
    if (!scope.program.enrollmentOpen) return route.fulfill({ status: 409, json: { code: 'conflict' } });
    const contact = this.enrollContact((route.request().postDataJSON() as { contact: string }).contact);
    if (!contact) return route.fulfill({ status: 422, json: { errors: { contact: 'Enter a mobile number or an email.' } } });
    return route.fulfill({ status: 202 });
  }

  private async enrollVerify(route: Route, slug: string): Promise<void> {
    const scope = await this.enrollScope(route, slug);
    if (!scope) return;
    const b = route.request().postDataJSON() as { contact: string; code: string };
    const contact = this.enrollContact(b.contact);
    if (!contact || b.code !== this.guardianCode) return route.fulfill({ status: 422, json: { errors: { code: 'That code didn’t work. Check the latest text or email.' } } });
    const household = this.households.find(
      (h) => h.organizationId === scope.org.id && h.guardians.some((g) => (contact.includes('@') ? g.email?.toLowerCase() === contact : g.mobile?.replace(/\D/g, '') === contact)),
    );
    this.enrollSession = { programId: scope.program.id, contact, householdId: household?.id ?? null, draft: null, submitted: false };
    return route.fulfill({ status: 204 });
  }

  private async enrollSessionFor(route: Route, slug: string) {
    const scope = await this.enrollScope(route, slug);
    if (!scope) return null;
    if (!this.enrollSession || this.enrollSession.programId !== scope.program.id) {
      await route.fulfill({ status: 401, json: { code: 'verification-required' } });
      return null;
    }
    return { ...scope, session: this.enrollSession };
  }

  private async enrollDraft(route: Route, slug: string): Promise<void> {
    const found = await this.enrollSessionFor(route, slug);
    if (!found) return;
    const { program, session } = found;
    const code = (language: string | null) => (language === 'Spanish' ? 'es' : language === 'French' ? 'fr' : 'en');
    if (session.draft) {
      return route.fulfill({ json: { returning: !!session.householdId, language: code(session.draft.household.language), program: program.name, ...session.draft } });
    }
    const household = session.householdId ? this.households.find((h) => h.id === session.householdId) : undefined;
    if (household) {
      const g = this.sortedGuardians(household)[0]!;
      return route.fulfill({
        json: {
          returning: true,
          language: code(household.language),
          program: program.name,
          household: { guardianName: g.name, mobile: g.mobile, email: g.email, language: household.language },
          children: [...household.children]
            .sort((a, z) => a.firstName.localeCompare(z.firstName))
            .map((c) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, dateOfBirth: c.dateOfBirth, school: c.school, allergies: c.medical.allergies, medication: c.medical.medication, enroll: true })),
        },
      });
    }
    const phone = session.contact.includes('@') ? null : `${session.contact.slice(0, 3)}-${session.contact.slice(3, 6)}-${session.contact.slice(6)}`;
    return route.fulfill({ json: { returning: false, language: 'en', program: program.name, household: { guardianName: null, mobile: phone, email: phone ? null : session.contact, language: 'English' }, children: [] } });
  }

  private async enrollSave(route: Route, slug: string): Promise<void> {
    const found = await this.enrollSessionFor(route, slug);
    if (!found) return;
    const draft = route.request().postDataJSON() as FakeEnrollDraft;
    const errors: Record<string, string> = {};
    if (!draft.household?.guardianName?.trim()) errors['guardianName'] = 'Enter your full name.';
    if (!draft.household?.mobile?.trim() && !draft.household?.email?.trim()) errors['mobile'] = 'Add a mobile number or an email.';
    const children = draft.children ?? [];
    if (!children.some((c) => c.enroll)) errors['children'] = 'Add at least one child.';
    children.forEach((c, i) => {
      if (!c.enroll) return;
      if (!c.firstName?.trim() || !c.lastName?.trim()) errors[`children[${i}].name`] = 'Enter the child’s first and last name.';
      if (!c.dateOfBirth) errors[`children[${i}].dateOfBirth`] = 'Enter the child’s date of birth.';
    });
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    found.session.draft = draft;
    return route.fulfill({ status: 204 });
  }

  private async enrollSubmit(route: Route, slug: string): Promise<void> {
    const found = await this.enrollSessionFor(route, slug);
    if (!found) return;
    const { program, session } = found;
    if (session.submitted || !program.enrollmentOpen || !session.draft) return route.fulfill({ status: 409, json: { code: 'conflict' } });
    if (!(route.request().postDataJSON() as { consent: boolean }).consent) return route.fulfill({ status: 422, json: { errors: { consent: 'Agree to the season consent to submit.' } } });
    let waitlisted = this.enrollmentRequests.filter((r) => r.programId === program.id && r.status === 'Waitlisted').length;
    let first: number | null = null;
    const children = session.draft.children.filter((c) => c.enroll);
    for (const _ of children) {
      const full = program.roster.length >= program.capacity;
      const position = full ? ++waitlisted : null;
      first ??= position;
      this.enrollmentRequests.push({ programId: program.id, status: full ? 'Waitlisted' : 'WaitingReview', position });
    }
    session.submitted = true;
    return route.fulfill({ json: { status: first === null ? 'WaitingReview' : 'Waitlisted', position: first, children: children.length, program: program.name } });
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
    const raw = route.request().postDataBuffer()?.toString('utf-8') ?? '';
    const fileName = /filename="([^"]+)"/.exec(raw)?.[1] ?? 'file';
    const start = raw.indexOf('\r\n\r\n') + 4;
    const end = raw.lastIndexOf('\r\n--');
    const text = raw.slice(start, end > start ? end : undefined).replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (!fileName.toLowerCase().endsWith('.csv') || text.includes('\u0000') || lines.length === 0 || !lines[0]!.includes(',')) {
      return route.fulfill({ status: 422, json: { errors: { file: `We couldn’t read ${fileName}. Export it as CSV or XLSX and try again. Nothing was imported.` } } });
    }
    const [header, ...rows] = lines.map((l) => l.split(','));
    const imp: FakeImport = { id: `imp-${this.nextId++}`, organizationId: m.organizationId, fileName, headers: header!.map((h) => h.trim()), rows, mapping: null, programId: null, done: false };
    this.imports.push(imp);
    const columns = imp.headers.map((name, i) => ({
      name,
      sample: rows.map((r) => r[i]).find((v) => v && v.trim()) ?? null,
      field: IMPORT_SYNONYMS.find(([, names]) => names.includes(name.toLowerCase()))?.[0] ?? null,
    }));
    return route.fulfill({ status: 201, json: { id: imp.id, fileName, rowCount: rows.length, matched: columns.filter((c) => c.field).length, columns } });
  }

  private importRows(imp: FakeImport) {
    const value = (row: string[], field: ImportField) => {
      const column = Object.entries(imp.mapping ?? {}).find(([, f]) => f === field)?.[0];
      const v = column ? row[imp.headers.indexOf(column)]?.trim() : undefined;
      return v ? v : null;
    };
    return imp.rows.map((row, i) => ({
      line: i + 2,
      child: value(row, 'ChildName') ?? '',
      dob: value(row, 'DateOfBirth'),
      guardian: value(row, 'GuardianName'),
      phone: value(row, 'GuardianPhone'),
      email: value(row, 'GuardianEmail'),
    }));
  }

  private importProblem(r: { child: string; phone: string | null; email: string | null }): string | null {
    return !r.child ? 'No child name' : !r.phone && !r.email ? 'No phone or email' : !r.phone ? 'No mobile; email only' : null;
  }

  private importDuplicates(m: Membership, imp: FakeImport): Set<number> {
    const existing = this.childrenOf(m).map(({ child }) => `${child.firstName} ${child.lastName}`.toLowerCase() + '|' + child.dateOfBirth);
    return new Set(this.importRows(imp).filter((r) => existing.includes(`${r.child.toLowerCase()}|${r.dob}`)).map((r) => r.line));
  }

  private async mapImport(route: Route, id: string): Promise<void> {
    const m = await this.importCaller(route);
    if (!m) return;
    const imp = this.imports.find((x) => x.id === id && x.organizationId === m.organizationId);
    if (!imp) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as { mapping: Record<string, ImportField>; programId: string | null };
    const mapping = Object.fromEntries(Object.entries(b.mapping ?? {}).filter(([c, f]) => imp.headers.includes(c) && f !== 'Skip'));
    const fields = Object.values(mapping);
    const errors: Record<string, string> = {};
    if (!fields.includes('ChildName')) errors['ChildName'] = 'Map the child’s name.';
    if (!fields.includes('GuardianName')) errors['GuardianName'] = 'Map the guardian’s name.';
    if (!fields.includes('GuardianPhone') && !fields.includes('GuardianEmail')) errors['GuardianContact'] = 'Map the guardian’s phone or email.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    Object.assign(imp, { mapping, programId: b.programId ?? null });
    const rows = this.importRows(imp);
    const duplicates = this.importDuplicates(m, imp);
    return route.fulfill({
      json: {
        rows: rows.length,
        duplicates: rows.filter((r) => duplicates.has(r.line)).map((r) => ({ row: r.line, child: r.child, reason: 'Already in PromiseHub: same name and date of birth' })),
        needLook: rows.filter((r) => this.importProblem(r)).map((r) => ({ row: r.line, child: r.child, reason: this.importProblem(r) })),
        programName: this.programs.find((p) => p.id === b.programId)?.name ?? null,
      },
    });
  }

  private async runImport(route: Route, id: string): Promise<void> {
    const m = await this.importCaller(route);
    if (!m) return;
    const imp = this.imports.find((x) => x.id === id && x.organizationId === m.organizationId);
    if (!imp) return route.fulfill({ status: 404 });
    if (imp.done || !imp.mapping) return route.fulfill({ status: 409, json: { code: 'conflict' } });
    const merge = new Set((route.request().postDataJSON() as { merge: number[] }).merge ?? []);
    const duplicates = this.importDuplicates(m, imp);
    const created = new Set<string>();
    const updated = new Set<string>();
    const toFix: { row: number; child: string; reason: string }[] = [];
    let imported = 0;
    let children = 0;
    let skipped = 0;
    for (const r of this.importRows(imp)) {
      const problem = this.importProblem(r);
      if (problem === 'No child name' || problem === 'No phone or email') {
        toFix.push({ row: r.line, child: r.child, reason: problem });
        continue;
      }
      if (duplicates.has(r.line) && !merge.has(r.line)) {
        skipped++;
        continue;
      }
      const onFile = this.households.find((h) => h.organizationId === m.organizationId && h.guardians.some((g) => g.mobile && r.phone && g.mobile === r.phone));
      if (onFile) updated.add(onFile.id);
      else created.add(r.phone ?? r.email ?? r.guardian ?? r.child);
      if (!duplicates.has(r.line)) children++;
      imported++;
    }
    imp.done = true;
    return route.fulfill({
      json: { fileName: imp.fileName, rows: imp.rows.length, imported, familiesCreated: created.size, familiesUpdated: updated.size, children, enrolled: imp.programId ? children : 0, skipped, needFix: toFix.length, toFix, programName: this.programs.find((p) => p.id === imp.programId)?.name ?? null },
    });
  }

  private guardianLanguage(language: string): string {
    return language === 'Spanish' ? 'es' : language === 'French' ? 'fr' : 'en';
  }

  /** Resolves a guardian link like the server: gone, module off, verification needed, or the page's data. */
  private async incidentCaller(route: Route): Promise<Membership | null> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      await this.unauthenticated(route);
      return null;
    }
    if (!this.modules.get(m.organizationId)!.includes('Incidents')) {
      await route.fulfill({ status: 404 });
      return null;
    }
    return m;
  }

  private readableIncidents(m: Membership) {
    const log = ['Admin', 'ProgramDirector'].includes(m.role);
    return this.incidents.filter((i) => i.organizationId === m.organizationId && (log || i.reporterId === m.id));
  }

  private childName(id: string): string {
    const c = this.households.flatMap((h) => h.children).find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : '';
  }

  private async listIncidents(route: Route): Promise<void> {
    const m = await this.incidentCaller(route);
    if (!m) return;
    const incidents = this.readableIncidents(m).map((i) => ({ id: i.id, category: i.category, child: this.childName(i.childId), occurredAt: i.occurredAt, severity: i.severity, status: i.status, reportedBy: i.reportedBy }));
    return route.fulfill({ json: { canReadLog: ['Admin', 'ProgramDirector'].includes(m.role), incidents } });
  }

  private async incidentForm(route: Route): Promise<void> {
    const m = await this.incidentCaller(route);
    if (!m) return;
    const supervisor = memberships.filter((x) => x.organizationId === m.organizationId && x.role === 'ProgramDirector').map((x) => x.personName).sort()[0] ?? null;
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
    i.trail = [...(i.trail ?? [{ text: `${i.reportedBy} submitted the report`, at: i.reportedAt }]), { text: `${m.personName} opened the report`, at: NOW.toISOString() }];
    const { organizationId: _, reporterId: __, ...rest } = i;
    return route.fulfill({ json: { ...rest, review: i.review ?? null, followUps: i.followUps ?? [], child: this.childName(i.childId), canReview: ['Admin', 'ProgramDirector'].includes(m.role) } });
  }

  private async createIncident(route: Route): Promise<void> {
    const m = await this.incidentCaller(route);
    if (!m) return;
    const b = route.request().postDataJSON() as Record<string, string | null>;
    const errors: Record<string, string> = {};
    if (!b['category']) errors['category'] = 'Choose the type.';
    const child = this.households.filter((h) => h.organizationId === m.organizationId).flatMap((h) => h.children).find((c) => c.id === b['childId']);
    if (!child) errors['childId'] = 'Choose the child involved.';
    if (!b['occurredAt']) errors['occurredAt'] = 'Enter when it happened.';
    if (!b['whatHappened']?.trim()) errors['whatHappened'] = 'Describe what happened.';
    if (!b['actionTaken']?.trim()) errors['actionTaken'] = 'Describe what you did.';
    if (!b['guardianContact']) errors['guardianContact'] = 'Say whether the guardian was contacted.';
    if (!b['severity']) errors['severity'] = 'Choose the severity.';
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const id = `inc-${this.nextId++}`;
    this.incidents.push({ id, organizationId: m.organizationId, reporterId: m.id, reportedBy: m.personName, category: b['category']!, childId: child!.id, occurredAt: new Date(b['occurredAt']!).toISOString(), place: b['place'] || 'Other', whatHappened: b['whatHappened']!.trim(), actionTaken: b['actionTaken']!.trim(), guardianContact: b['guardianContact']!, severity: b['severity']!, status: 'NeedsReview', reportedAt: NOW.toISOString() });
    return route.fulfill({ status: 201, json: { id } });
  }

  private async incidentSupervisor(route: Route, id: string) {
    const m = await this.incidentCaller(route);
    if (!m) return null;
    if (!['Admin', 'ProgramDirector'].includes(m.role)) {
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
    if (i.status === 'Closed') return route.fulfill({ status: 409, json: { code: 'conflict' } });
    const b = route.request().postDataJSON() as { note?: string; outcome?: string };
    if (!b.note?.trim()) return route.fulfill({ status: 422, json: { errors: { note: 'Write a review note.' } } });
    i.review = { note: b.note.trim(), outcome: b.outcome ?? 'ClosedNoAction', by: m.personName, at: NOW.toISOString() };
    i.status = b.outcome === 'KeepOpen' ? 'Open' : 'Closed';
    return route.fulfill({ status: 204 });
  }

  private async reopenIncident(route: Route, id: string): Promise<void> {
    const found = await this.incidentSupervisor(route, id);
    if (!found) return;
    if (found.i.status !== 'Closed') return route.fulfill({ status: 409, json: { code: 'conflict' } });
    found.i.status = 'Open';
    return route.fulfill({ status: 204 });
  }

  private async addIncidentNote(route: Route, id: string): Promise<void> {
    const m = await this.incidentCaller(route);
    if (!m) return;
    const i = this.readableIncidents(m).find((x) => x.id === id);
    if (!i) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as { text?: string };
    if (!b.text?.trim()) return route.fulfill({ status: 422, json: { errors: { text: 'Write the follow-up.' } } });
    i.followUps = [...(i.followUps ?? []), { text: b.text.trim(), by: m.personName, at: NOW.toISOString() }];
    return route.fulfill({ status: 204 });
  }

  /** A slip link or a home link: either picks the household. */
  private linkOf(token: string): { householdId: string } | undefined {
    const home = this.homeLinks.get(token);
    return home ? { householdId: home } : this.guardianLinks.get(token);
  }

  private async guardianHome(route: Route, token: string): Promise<void> {
    const householdId = this.homeLinks.get(token);
    const household = householdId ? this.households.find((h) => h.id === householdId) : undefined;
    const org = household ? organizations.find((o) => o.id === household.organizationId)! : undefined;
    if (!household || !org) return route.fulfill({ status: 410, json: { code: 'link-expired', organization: null, phone: null } });
    if (!this.modules.get(org.id)!.includes('Roster')) return route.fulfill({ status: 404 });
    if (!this.trustedHouseholds.has(household.id)) {
      const contacts = household.guardians.filter((g) => g.mobile).map((g) => `•••-•••-${g.mobile!.slice(-4)}`);
      return route.fulfill({ status: 401, json: { code: 'verification-required', language: this.guardianLanguage(household.language), organization: org.name, phone: '905-555-0100', contacts } });
    }
    const label = { Accepted: 'Enrolled', Waitlisted: 'Waitlisted', Declined: 'Declined', WaitingReview: 'WaitingReview' } as const;
    const children = [...household.children]
      .sort((a, z) => a.firstName.localeCompare(z.firstName))
      .map((c) => {
        const requests = this.enrollmentRequests.filter((r) => r.childId === c.id);
        const fromRequests = requests.map((r) => ({ program: this.programs.find((x) => x.id === r.programId)!, status: label[r.status], position: r.position, note: r.note ?? null }));
        const onRoster = this.programs.filter((x) => x.roster.includes(c.id) && !requests.some((r) => r.programId === x.id)).map((program) => ({ program, status: 'Enrolled', position: null, note: null }));
        return {
          name: `${c.firstName} ${c.lastName}`,
          firstName: c.firstName,
          enrollments: [...fromRequests, ...onRoster]
            .map((e) => ({ program: e.program.name, status: e.status, position: e.position, note: e.note, startsOn: e.program.startsOn, schedule: e.program.schedule }))
            .sort((a, z) => a.program.localeCompare(z.program)),
        };
      });
    const primary = this.sortedGuardians(household)[0];
    return route.fulfill({ json: { language: this.guardianLanguage(household.language), organization: org.name, phone: '905-555-0100', firstName: primary?.name.split(' ')[0] ?? '', children } });
  }

  private async guardianScope(route: Route, token: string) {
    const link = this.guardianLinks.get(token);
    const household = link ? this.households.find((h) => h.id === link.householdId) : undefined;
    const org = household ? organizations.find((o) => o.id === household.organizationId)! : undefined;
    const slip = link ? this.slips.get(link.eventId) : undefined;
    if (!link || !household || !org || link.expired || slip?.status !== 'Sent') {
      await route.fulfill({ status: 410, json: { code: 'link-expired', organization: org?.name ?? null, phone: org ? '905-555-0100' : null } });
      return null;
    }
    if (!this.modules.get(org.id)!.includes('Slips')) {
      await route.fulfill({ status: 404 });
      return null;
    }
    if (!this.trustedHouseholds.has(household.id)) {
      const contacts = household.guardians.filter((g) => g.mobile).map((g) => `•••-•••-${g.mobile!.slice(-4)}`);
      await route.fulfill({ status: 401, json: { code: 'verification-required', language: this.guardianLanguage(household.language), organization: org.name, phone: '905-555-0100', contacts } });
      return null;
    }
    const child = household.children.find((c) => c.id === link.childId)!;
    const event = this.events.find((e) => e.id === link.eventId)!;
    return { link, household, org, slip, child, event };
  }

  private async guardianCodeRoute(route: Route): Promise<void> {
    const b = route.request().postDataJSON() as { token: string; contact: string };
    const link = this.linkOf(b.token);
    if (!link) return route.fulfill({ status: 410, json: { code: 'link-expired' } });
    return route.fulfill({ status: 202 });
  }

  private async guardianVerify(route: Route): Promise<void> {
    const b = route.request().postDataJSON() as { token: string; code: string };
    const link = this.linkOf(b.token);
    if (!link) return route.fulfill({ status: 410, json: { code: 'link-expired' } });
    if (this.lockedLinks.has(b.token)) return route.fulfill({ status: 423, json: { code: 'locked' } });
    if (b.code !== this.guardianCode) {
      const wrong = (this.wrongCodes.get(b.token) ?? 0) + 1;
      this.wrongCodes.set(b.token, wrong);
      if (wrong >= 3) this.lockedLinks.add(b.token);
      return route.fulfill({ status: 422, json: { errors: { code: 'That code didn’t work. Check the latest text or email.' } } });
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
        phone: '905-555-0100',
        guardianName: primary?.name.split(' ')[0] ?? '',
        event: { name: event.name, startsAt: event.startsAt, endsAt: event.endsAt, place: event.place },
        child: { name: `${child.firstName} ${child.lastName}`, firstName: child.firstName, age: ageOf(child.dateOfBirth), allergies: child.medical.allergies, medication: child.medical.medication },
        emergencyContact: primary ? { name: primary.name, phone: primary.mobile } : null,
        title: slip.title || event.name,
        body: slip.body,
        signBy: slip.signBy,
        askPhotos: slip.askPhotos,
        askSwimming: slip.askSwimming,
        askLunch: slip.askLunch,
        status: current?.status ?? 'Open',
        answeredAt: current ? NOW.toISOString() : null,
        answeredBy: current?.by ?? null,
      },
    });
  }

  private async guardianAnswer(route: Route, token: string, status: 'Signed' | 'Declined'): Promise<void> {
    const scope = await this.guardianScope(route, token);
    if (!scope) return;
    const { household, slip, child } = scope;
    const current = slip.answers.get(child.id);
    if (current && current.version === slip.version && (status === 'Signed' || current.status === 'Declined')) return route.fulfill({ status: 409, json: { code: 'conflict' } });
    const b = route.request().postDataJSON() as { name?: string; reason?: string };
    const typed = (b.name ?? '').trim().replace(/\s+/g, ' ');
    const signer = household.guardians.find((g) => g.canSign && g.name.toLowerCase() === typed.toLowerCase());
    if (status === 'Signed') {
      if (!typed) return route.fulfill({ status: 422, json: { errors: { name: 'Type your full name to sign.' } } });
      if (!signer) return route.fulfill({ status: 422, json: { errors: { name: `That name doesn’t match a guardian of ${child.firstName}.` } } });
    }
    const by = signer?.name ?? this.sortedGuardians(household)[0]!.name;
    slip.answers.set(child.id, { status, by, version: slip.version });
    return route.fulfill({ status: 204 });
  }

  /** Families with a child still to answer the slip, as the server lists them. */
  private families(m: Membership, slip: FakeSlip, event: FakeEvent) {
    const outstanding = this.slipResponses(m, slip, event).filter((r) => r.status === 'Outstanding');
    return this.households
      .filter((h) => outstanding.some((r) => r.household === h.name && h.organizationId === m.organizationId))
      .sort((a, z) => a.name.localeCompare(z.name))
      .map((h) => {
        const reachable = h.guardians.some((g) => g.mobile || (g.email && !g.emailBounced));
        return {
          householdId: h.id,
          household: h.name,
          guardian: this.sortedGuardians(h)[0]?.name ?? null,
          children: outstanding.filter((r) => r.household === h.name).map((r) => r.child.split(' ')[0]!),
          childIds: outstanding.filter((r) => r.household === h.name).map((r) => r.childId),
          lastRemindedAt: null as string | null,
          reachable,
          reason: reachable ? null : h.guardians.some((g) => g.emailBounced) ? 'Email bounced, no mobile' : 'No mobile or email',
        };
      });
  }

  private async clearance(route: Route, sessionId: string): Promise<void> {
    const m = await this.slipsCaller(route);
    if (!m) return;
    const event = this.ownEvent(m, sessionId);
    const slip = event?.requiresSlip ? this.slips.get(event.id) : undefined;
    if (!event || !slip || slip.status !== 'Sent') return route.fulfill({ status: 404 });
    const order: Record<string, number> = { Missing: 0, Declined: 1, Cleared: 2 };
    const children = this.slipResponses(m, slip, event)
      .map((r) => ({ childId: r.childId, householdId: this.households.find((h) => h.name === r.household && h.organizationId === m.organizationId)!.id, name: r.child, status: r.status === 'Signed' ? 'Cleared' : r.status === 'Declined' ? 'Declined' : 'Missing' }))
      .sort((a, z) => order[a.status]! - order[z.status]! || a.name.localeCompare(z.name));
    return route.fulfill({
      json: { slipId: slip.id, title: slip.title || event.name, cleared: children.filter((c) => c.status === 'Cleared').length, missing: children.filter((c) => c.status === 'Missing').length, declined: children.filter((c) => c.status === 'Declined').length, children },
    });
  }

  private async unsignedFamilies(route: Route, id: string): Promise<void> {
    const m = await this.slipsCaller(route);
    if (!m) return;
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    return route.fulfill({ json: { households: this.families(m, found.slip, found.event).map(({ childIds: _, ...f }) => f) } });
  }

  private async remindNow(route: Route, id: string): Promise<void> {
    const m = await this.slipsCaller(route, true);
    if (!m) return;
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as { body: string };
    if (!(b.body ?? '').includes('{link}')) return route.fulfill({ status: 422, json: { errors: { body: 'Keep {link} in the message.' } } });
    const families = this.families(m, found.slip, found.event);
    return route.fulfill({ json: { households: families.filter((f) => f.reachable).length, unreachable: families.filter((f) => !f.reachable).length } });
  }

  private async signOnTablet(route: Route, id: string): Promise<void> {
    const m = await this.slipsCaller(route);
    if (!m) return;
    if (!can.runSessions(m)) return this.forbidden(route);
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const b = route.request().postDataJSON() as { householdId: string; name: string };
    const family = this.families(m, found.slip, found.event).find((f) => f.householdId === b.householdId);
    if (!family) return route.fulfill({ status: 409, json: { code: 'conflict' } });
    const typed = (b.name ?? '').trim().replace(/\s+/g, ' ');
    if (!typed) return route.fulfill({ status: 422, json: { errors: { name: 'The guardian needs to type their full name.' } } });
    const household = this.households.find((h) => h.id === b.householdId)!;
    const signer = household.guardians.find((g) => g.canSign && g.name.toLowerCase() === typed.toLowerCase());
    if (!signer) return route.fulfill({ status: 422, json: { errors: { name: 'That name doesn’t match a guardian of this family.' } } });
    for (const childId of family.childIds) found.slip.answers.set(childId, { status: 'Signed', by: signer.name, version: found.slip.version });
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
        title: '',
        body: '',
        signBy: e.startsAt.slice(0, 10),
        askPhotos: true,
        askSwimming: false,
        askLunch: true,
        reminders: 'TwiceWeekly',
        channel: 'TextAndEmail',
        status: 'Draft',
        scheduledFor: null,
        sentAt: null,
        version: 1,
        answers: new Map(),
        messageId: null,
      });
    }
    return this.slips.get(eventId);
  }

  private slipById(m: Membership, id: string): { slip: FakeSlip; event: FakeEvent } | undefined {
    const slip = [...this.slips.values()].find((x) => x.id === id);
    const event = slip ? this.ownEvent(m, slip.eventId) : undefined;
    return slip && event ? { slip, event } : undefined;
  }

  private async slipsCaller(route: Route, write = false): Promise<Membership | null> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) {
      await this.unauthenticated(route);
      return null;
    }
    if (!this.modules.get(m.organizationId)!.includes('Slips')) {
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
        return { childId: child.id, child: `${child.firstName} ${child.lastName}`, household: household.name, status: current?.status ?? 'Outstanding', signedBy: current?.by ?? null };
      });
  }

  private slipDto(m: Membership, slip: FakeSlip, event: FakeEvent) {
    const responses = this.slipResponses(m, slip, event);
    const message = this.messages.find((x) => x.id === slip.messageId);
    const of = (status: FakeDelivery['status']) => (message?.deliveries ?? []).filter((d) => d.status === status).map((d) => d.household).sort();
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
      signed: responses.filter((r) => r.status === 'Signed').length,
      declined: responses.filter((r) => r.status === 'Declined').length,
      outstanding: responses.filter((r) => r.status === 'Outstanding').length,
      responses,
      delivery: message ? { sent: of('Sent').length, emailInstead: of('FellBackToEmail'), paused: of('Paused'), failed: of('Failed') } : null,
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
    if (slip.status === 'Sent') return route.fulfill({ status: 409, json: { code: 'conflict' } });
    const b = route.request().postDataJSON() as Pick<FakeSlip, 'title' | 'body' | 'signBy' | 'askPhotos' | 'askSwimming' | 'askLunch' | 'reminders' | 'channel'>;
    if ((b.body ?? '').trim().length > 600) return route.fulfill({ status: 422, json: { errors: { body: 'Keep it to 600 characters.' } } });
    Object.assign(slip, { ...b, title: (b.title ?? '').trim(), body: (b.body ?? '').trim() });
    return route.fulfill({ status: 204 });
  }

  private slipErrors(title: string, body: string, signBy: string, event: FakeEvent): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors['title'] = 'Enter a slip title.';
    if (!body.trim()) errors['body'] = 'Enter the slip text.';
    // Event days are in Hamilton time; the seeded events start in the afternoon UTC, so the UTC date is the local date.
    const day = event.startsAt.slice(0, 10);
    if (signBy >= day) {
      const label = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`)).replace(',', '');
      errors['signBy'] = `Must be before ${label}.`;
    }
    return errors;
  }

  /** Queues the slip's message to the event's households through the same path as Messages. */
  private deliverSlip(m: Membership, slip: FakeSlip, event: FakeEvent, edited: boolean): void {
    const org = organizations.find((o) => o.id === m.organizationId)!;
    const audience = this.audienceOf(m, { programId: null, eventId: event.id, language: null, body: '', channel: slip.channel === 'EmailOnly' ? 'EmailOnly' : 'TextWithEmailFallback' });
    const title = slip.title || event.name;
    const body = edited ? `The permission slip for “${title}” has changed. Please read it and sign again.` : `Please sign the permission slip for “${title}”.`;
    const segments = segmentsOf(`${org.name}: ${body}`);
    const deliveries: FakeDelivery[] = audience.recipients.map((r) => {
      const base = { household: r.household, guardian: r.guardian, language: r.language, at: null as string | null };
      if (r.unreachable) return { ...base, channel: r.channel, status: 'Failed', reason: r.unreachable };
      if (r.channel === 'Email') return { ...base, channel: 'Email', status: 'Sent', reason: null, at: NOW.toISOString() };
      const { remaining, used } = this.capOf(m);
      if (remaining >= segments) {
        this.smsUsed.set(m.organizationId, used + segments);
        return { ...base, channel: 'Sms', status: 'Sent', reason: null, at: NOW.toISOString() };
      }
      return r.fallback ? { ...base, channel: 'Email', status: 'FellBackToEmail', reason: 'SMS cap reached', at: NOW.toISOString() } : { ...base, channel: 'Sms', status: 'Paused', reason: 'SMS cap reached' };
    });
    const id = `msg-${this.nextId++}`;
    this.messages.unshift({ id, organizationId: m.organizationId, title: `Permission slip: ${title}`, body, sentAt: NOW.toISOString(), sentBy: m.personName, audience: audience.label, channel: slip.channel === 'EmailOnly' ? 'EmailOnly' : 'TextWithEmailFallback', deliveries });
    slip.messageId = id;
    if (!edited) Object.assign(slip, { status: 'Sent', sentAt: NOW.toISOString(), scheduledFor: null });
    event.slipStatus = 'Sent';
  }

  private async sendSlipRoute(route: Route, id: string): Promise<void> {
    const m = await this.slipsCaller(route, true);
    if (!m) return;
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const { slip, event } = found;
    if (slip.status === 'Sent') return route.fulfill({ status: 409, json: { code: 'conflict' } });
    const errors = this.slipErrors(slip.title || event.name, slip.body, slip.signBy, event);
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    const b = route.request().postDataJSON() as { at?: string | null };
    if (b.at && b.at > NOW.toISOString()) {
      Object.assign(slip, { status: 'Scheduled', scheduledFor: b.at });
      event.slipStatus = 'Scheduled';
    } else {
      this.deliverSlip(m, slip, event, false);
    }
    return route.fulfill({ status: 204 });
  }

  private async slipTransition(route: Route, id: string, action: 'send-now' | 'cancel'): Promise<void> {
    const m = await this.slipsCaller(route, true);
    if (!m) return;
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const { slip, event } = found;
    if (slip.status !== 'Scheduled') return route.fulfill({ status: 409, json: { code: 'conflict' } });
    if (action === 'send-now') {
      this.deliverSlip(m, slip, event, false);
    } else {
      Object.assign(slip, { status: 'Draft', scheduledFor: null });
      event.slipStatus = 'Draft';
    }
    return route.fulfill({ status: 204 });
  }

  private async editSlip(route: Route, id: string): Promise<void> {
    const m = await this.slipsCaller(route, true);
    if (!m) return;
    const found = this.slipById(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const { slip, event } = found;
    if (slip.status !== 'Sent') return route.fulfill({ status: 409, json: { code: 'conflict' } });
    const b = route.request().postDataJSON() as { title: string; body: string; signBy: string; material: boolean };
    const errors = this.slipErrors(b.title ?? '', b.body ?? '', b.signBy, event);
    if (Object.keys(errors).length) return route.fulfill({ status: 422, json: { errors } });
    Object.assign(slip, { title: b.title.trim(), body: b.body.trim(), signBy: b.signBy });
    if (b.material) {
      slip.version++;
      this.deliverSlip(m, slip, event, true);
    }
    return route.fulfill({ status: 204 });
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
        return { id: slip.id, eventId: e.id, title: slip.title || e.name, programName: program.name, signBy: slip.signBy, status: slip.status, children: responses.length, signed: responses.filter((r) => r.status === 'Signed').length, declined: responses.filter((r) => r.status === 'Declined').length };
      });
    return route.fulfill({ json: { slips } });
  }

  private async quickCard(route: Route, id: string): Promise<void> {
    const m = memberships.find((x) => x.id === this.membershipId);
    if (!m) return this.unauthenticated(route);
    if (!this.modules.get(m.organizationId)!.includes('QuickCards')) return route.fulfill({ status: 404 });
    const found = this.ownChild(m, id);
    if (!found) return route.fulfill({ status: 404 });
    const { child, household } = found;
    const allowed = can.readMedical(m);
    const med = child.medical;
    const hasMedical = !!(med.allergies || med.medication || med.conditions || med.doctor || med.healthCard);
    const guardians = [...household.guardians].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name));
    return route.fulfill({
      json: {
        id: child.id,
        householdId: household.id,
        name: `${child.firstName} ${child.lastName}`,
        age: ageOf(child.dateOfBirth),
        school: child.school,
        programs: this.programs.filter((p) => p.organizationId === m.organizationId && p.roster.includes(child.id)).map((p) => p.name).sort(),
        primaryGuardian: guardians[0]?.name ?? null,
        language: household.language,
        allergyAlert: allowed && med.redAlert && med.allergies ? { title: `Severe allergy: ${med.allergies}`, instruction: med.alertInstruction ?? null } : null,
        medical: allowed && hasMedical ? { allergies: med.allergies, medication: med.medication, conditions: med.conditions, doctor: med.doctor, healthCard: med.healthCard ?? null } : null,
        callOrder: guardians.filter((g) => g.mobile).map((g) => ({ name: g.name, relationship: g.relationship, phone: g.mobile, language: g.language, isPrimary: g.isPrimary })),
        approvedPickups: guardians.filter((g) => g.canPickUp).map((g) => ({ name: g.name, relationship: g.relationship, isPrimary: g.isPrimary })),
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
    await route.fulfill({ status: 599, body: 'Unrouted request in the fake API' });
  }
}
