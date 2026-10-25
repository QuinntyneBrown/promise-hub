import type { Page, Route } from '@playwright/test';
import { type FakeHousehold, ageOf, hasMedicalFlag, medicalFlag, reachable, seedHouseholds } from './households';
import { type Membership, type ModuleId, moduleCatalog, memberships, organizations, seededMfaCode, seededPassword } from './seed';

/** Mirrors backend RolePermissions. */
const can = {
  writeHouseholds: (m: Membership) => ['Admin', 'ProgramDirector'].includes(m.role),
  deleteHouseholds: (m: Membership) => m.role === 'Admin',
  readMedical: (m: Membership) => ['Admin', 'ProgramDirector', 'SiteLead'].includes(m.role),
  writeMedical: (m: Membership) => ['Admin', 'ProgramDirector'].includes(m.role),
};

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
    const body = route.request().postDataJSON() as { allergies: string; medication: string; conditions: string; doctor: string; redAlert: boolean };
    const clean = (v: string) => v?.trim() || null;
    found.child.medical = {
      allergies: clean(body.allergies),
      medication: clean(body.medication),
      conditions: clean(body.conditions),
      doctor: clean(body.doctor),
      redAlert: body.redAlert,
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

  private startSession(membershipId: string): void {
    this.membershipId = membershipId;
    this.expired = false;
  }

  private async reject(route: Route): Promise<void> {
    this.unrouted.push(`${route.request().method()} ${route.request().url()}`);
    await route.fulfill({ status: 599, body: 'Unrouted request in the fake API' });
  }
}
