import type { Page, Route } from '@playwright/test';
import { memberships, organizations, seededMfaCode, seededPassword } from './seed';

type Handler = (route: Route) => Promise<void>;

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

  constructor(private membershipId: string | null) {}

  /** Makes the next calls to a route answer with the given status, as the real API would on a fault. */
  failNext(path: string, status: number): void {
    this.failures.set(path, status);
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
  ];

  private async handle(route: Route): Promise<void> {
    const url = new URL(route.request().url());
    const failure = this.failures.get(url.pathname);
    if (failure) {
      return route.fulfill({ status: failure });
    }
    for (const [method, pattern, handler] of this.routes) {
      if (pattern.test(url.pathname) && route.request().method() === method) {
        return handler(route);
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

  private startSession(membershipId: string): void {
    this.membershipId = membershipId;
    this.expired = false;
  }

  private async reject(route: Route): Promise<void> {
    this.unrouted.push(`${route.request().method()} ${route.request().url()}`);
    await route.fulfill({ status: 599, body: 'Unrouted request in the fake API' });
  }
}
