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
};

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
  private nextId = 1;

  constructor(private membershipId: string | null) {}

  /** Makes the next calls to a route answer with the given status, as the real API would on a fault. */
  failNext(path: string, status: number): void {
    this.failures.set(path, status);
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
    return route.fulfill({
      json: {
        ...rest,
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
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .map((e) => this.sessionSummary(e));
    return route.fulfill({ json: { sessions } });
  }

  private async sessionRoster(route: Route, id: string): Promise<void> {
    const m = await this.rollCallCaller(route);
    if (!m) return;
    const e = this.ownEvent(m, id);
    if (!e) return route.fulfill({ status: 404 });
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
